const Discord = require('discord.js');
const prettyMs = require('pretty-ms');
const MongoClient = require('mongodb').MongoClient;

const Util = require('./util');

const settings = require('./../settings.json');

const CommandProcessor = require('./command-processor');
const EmojiStatsStorage = require('./emoji-stats/storage-adapter');
const EmojiUsageCollector = require('./emoji-stats/emoji-usage-collector');
const MessageParser = require('./message-parser');
const ExecutionPolicy = require('./execution-policy');
const PersistentExecutionPolicy = require('./persistent-execution-policy');
const PersistentCustomCommandsManager = require('./persistent-custom-commands-manager');
const CommandFactory = require('./command-factory');
const ServerInfoExtractor = require('./server-info-extractor');
const CustomCommandParser = require('./parsers/custom-command-parser');
const SandboxManager = require('./js-sandbox/sandbox-manager');
const PersistentSchedulerService = require('./persistent-scheduler-service');

const { CustomEmojiFilter, ChannelMentionResolver, ResponseSizeFilter } = require('./filters');
const EmbedValidator = require('./embed-validator');
class App {
    async init() {
        const mongoConnStr = process.env['MONGODB_URI'] || process.env['MONGOLAB_URI'] || process.env['MONGOHQ_URL'];

        try {
            this._db = await MongoClient.connect(mongoConnStr, { reconnectInterval: 60000 });
        } catch (e) {
            console.error('Storage not available. Exiting.');
            process.exit();
        }
        this._sandboxManager = new SandboxManager();
        this._msgParser = new MessageParser();
        this._customCommandsManager = new PersistentCustomCommandsManager(this._db);
        this._client = new Discord.Client({ autoReconnect: true });
        this._statsStorage = new EmojiStatsStorage(this._db);
        this._collector = new EmojiUsageCollector(this._client, await this._statsStorage.loadAll());
        this._guard = new PersistentExecutionPolicy(this._db);
        this._schedulerService = new PersistentSchedulerService(this._customCommandsManager, this._client, this._db);
        this._commandFactory = new CommandFactory(this._customCommandsManager, this._collector, this._schedulerService);
        this._cmdProc = new CommandProcessor(this._commandFactory, this._sandboxManager, this._customCommandsManager);
    }

    async run() {
        const botToken = process.env['bot-token'] || settings['bot-token'];

        await this.init();
        await this._schedulerService.loadTasks();

        this._sandboxManager.start();

        if (!settings['init-allow-commands'].every(x => this._commandFactory.has(x))) {
            console.error('\'init-allow-commands\' contain unknown command.');
            process.exit();
        }

        await this._customCommandsManager.loadCustomCommands();

        let autosaveTimer = null;
        this._collector.on('start', () => {
            autosaveTimer = setInterval(async () => {
                await this._statsStorage.updateAllStats(this._collector.allStats);
            }, Number.parseInt(settings['emoji-collector']['auto-save']));
        });

        this._collector.on('stop', () => {
            clearInterval(autosaveTimer);
        });

        this._collector.on('flush', async () => {
            await this._statsStorage.updateAllStats(this._collector.allStats);
        });

        this._collector.on('settingsUpdate', async (e) => {
            await this._statsStorage.updateSettings(e.serverId, e.settings);
        });

        await this._guard.loadPermissions();

        let updateTitleTimer = null;

        this._client.on('ready', async () => {
            console.log(`Logged in as ${this._client.user.tag}!`);
            try {
                this._collector.init();
            } catch (e) {
                conole.error(e.message);
            }

            updateTitleTimer = setInterval(() => {
                this._client.user.setActivity('Up: ' + prettyMs(process.uptime() * 1000));
            }, Number.parseInt(settings['update-status-interval']));
        });

        this._client.on('disconnect', () => {
            clearInterval(updateTitleTimer);
        });

        this._client.on('message', async msg => {
            if (this._client.user.id === msg.author.id || msg.author.bot) {
                return;
            }

            if (!Util.isGuildTextChannel(msg)) {
                return;
            }

            const mock = this._msgParser.parse(msg.content);

            let response = null;
            let outChannel = msg.channel;
            let isEmbed = false;
            try {
                if (mock.type === 'command') {
                    if (!(this._customCommandsManager.hasCommand(msg.guild.id, mock.name) || this._guard.check(msg, mock.name))) {
                        return;
                    }

                    const result = await this._cmdProc
                        .process(mock, msg.guild.id)
                        .execute(this._client, msg);

                    if (!msg.channel.permissionsFor(this._client.user).has('SEND_MESSAGES')) {
                        return;
                    }

                    if (result instanceof Object && result.hasOwnProperty('output')) {
                        const out = result.output;
                        if (out.hasOwnProperty('channel') && typeof out.channel === 'string') {
                            const redirectedChannel = msg.guild.channels.get(out.channel);
                            if (redirectedChannel) {
                                outChannel = redirectedChannel;
                            }
                        }

                        if (out.hasOwnProperty('embed') && out.embed === true) {
                            isEmbed = true;
                        }
                    }

                    response = typeof result === 'string' ? result : result.response;
                } else if (mock.type === 'source_code' && settings['js-sandbox']['prefix'].includes(mock.language.toLowerCase())) {
                    const customCmdParser = new CustomCommandParser();
                    if (customCmdParser.isCustomCmdSourceCode(mock.content)) {
                        const ccmd = customCmdParser.parse(mock.content);
                        if (this._commandFactory.has(ccmd.name)) {
                            throw new Error(`\`${ccmd.name}\` is reserved`);
                        }

                        const foundCcmd = this._customCommandsManager.getCommand(msg.guild.id, ccmd.name);
                        if (foundCcmd && foundCcmd.owner !== msg.author.id) {
                            const ownerObj = this._client.users.get(foundCcmd.owner);
                            throw new Error(`Command '${ccmd.name}' already owned by ${ownerObj ? ownerObj.username : foundCcmd.owner}`);
                        }
                        this._customCommandsManager.createCommand(msg.guild.id, msg.author.id, ccmd.name, ccmd.description, ccmd.sourceCode);
                        return;
                    }

                    const result = await this._sandboxManager.send(mock.content, ServerInfoExtractor.extract(msg), JSON.stringify({}), []);
                    response = new ResponseSizeFilter(result.response).filter();
                }
                if (response) {
                    response = new CustomEmojiFilter(response).filter(this._client.guilds, msg.guild.id);
                    response = new ChannelMentionResolver(response).resolve(msg);
                    if (isEmbed) {
                        try {
                            response = JSON.parse(response);
                        } catch (e) {
                            throw new Error(response + '\n' + e.message);
                        }

                        const embedValidationResult = new EmbedValidator().validate(response);
                        if (!embedValidationResult.valid) {
                            throw new Error(embedValidationResult.errors.map(x => x.stack).join('\n'));
                        }
                    }
                    await outChannel.send(response);
                }
            }
            catch (e) {
                if (e) {
                    await msg.channel.send(e.message);
                }
            }
        });

        this._client.on('guildCreate', guild => {
            settings['init-allow-commands']
                .forEach(x => this._guard.change(guild.id, x, { add: { users: [], groups: [guild.id] }, remove: { users: [], groups: [] } }));
        });

        this._client.on('guildDelete', guild => {
            this._guard.removeServer(guild.id);
        });

        this._client.on('error', (error) => {
            console.log(error.message);
        });

        try {
            await this._client.login(botToken);
        } catch (e) {
            console.error(e.message);
            process.exit();
        }

        process.on('SIGINT', async () => {
            await this._statsStorage.updateAllStats(this._collector.allStats);
        });
    }
}

module.exports = App;