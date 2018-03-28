const Discord = require('discord.js');
const prettyMs = require('pretty-ms');
const MongoClient = require('mongodb').MongoClient;

const Util = require('./util');

const settings = require('./../settings.json');
const JsSandboxCommand = require('./commands/js-sandbox-command');
const CommandProcessor = require('./command-processor');
const PersistentCommandProcessor = require('./persistent-command-processor');

const CustomEmojiFilter = require('./filters/custom-emoji-filter');
const ChannelMentionResolver = require('./filters/channel-mention-resolver');

const EmojiStatsStorage = require('./emoji-stats/storage-adapter');
const EmojiUsageCollector = require('./emoji-stats/emoji-usage-collector');
const MessageParser = require('./message-parser');
const ExecutionPolicy = require('./execution-policy');

const SandboxManager = require('./js-sandbox/sandbox-manager');

const Services = require('./services');

class App {
    async run() {
        const botToken = process.env['bot-token'] || settings['bot-token'];
        const mongoConnStr = process.env['MONGODB_URI'] || process.env['MONGOLAB_URI'] || process.env['MONGOHQ_URL'];

        try {
            const storage = await MongoClient.connect(mongoConnStr, { reconnectInterval: 60000 });
            Services.register('storage', storage);
        } catch (e) {
            console.error('Storage not available. Exiting.');
            process.exit();
        }

        const sandboxManager = new SandboxManager();
        sandboxManager.start();

        const msgParser = new MessageParser();

        const cmdProc = new PersistentCommandProcessor(Services.resolve('storage'));
        await cmdProc.loadCustomCommands();

        const client = new Discord.Client({ autoReconnect: true });

        const statsStorage = new EmojiStatsStorage();
        const collector = new EmojiUsageCollector(client, await statsStorage.loadAll());

        let autosaveTimer = null;
        collector.on('start', () => {
            autosaveTimer = setInterval(async () => {
                await statsStorage.updateAllStats(collector.allStats);
            }, Number.parseInt(settings['emoji-collector']['auto-save']));
        });

        collector.on('stop', () => {
            clearInterval(autosaveTimer);
        });

        collector.on('flush', async () => {
            await statsStorage.updateAllStats(collector.allStats);
        });

        collector.on('settingsUpdate', async (e) => {
            await statsStorage.updateSettings(e.serverId, e.settings);
        });

        const guard = new ExecutionPolicy(cmdProc.commands);
        await guard.loadPermissions();

        Services.register('client', client);
        Services.register('commandprocessor', cmdProc);
        Services.register('emojicollector', collector);
        Services.register('sandboxmanager', sandboxManager);

        let updateTitleTimer = null;

        client.on('ready', async () => {
            console.log(`Logged in as ${client.user.tag}!`);
            try {
                collector.init();
            } catch (e) {
                conole.error(e.message);
            }

            updateTitleTimer = setInterval(() => client.user.setActivity('Up: ' + prettyMs(process.uptime() * 1000)), Number.parseInt(settings['update-status-interval']));
        });

        client.on('disconnect', () => {
            clearInterval(updateTitleTimer);
        });

        client.on('message', async msg => {
            if (client.user.id === msg.author.id || msg.author.bot) {
                return;
            }

            if (!Util.isGuildTextChannel(msg)) {
                return;
            }

            const mock = msgParser.parse(msg.content);

            if (!(cmdProc.hasCustomCommand(msg.guild.id, mock.name) || guard.check(msg, mock))) {
                return;
            }

            const command = cmdProc.process(mock, msg.guild.id);

            try {
                let response = await command.execute(client, msg);
                if (typeof response === 'string') {
                    response = new CustomEmojiFilter(response).filter(client.guilds, msg.guild.id);
                    response = new ChannelMentionResolver(response).resolve(msg);
                    await msg.channel.send(response);
                }
            } catch (e) {
                if (e) {
                    await msg.channel.send(e.message);
                }
            }
        });

        client.on('error', (error) => {
            console.log(error.message);
        });

        try {
            await client.login(botToken);
        } catch (e) {
            console.error(e.message);
            process.exit();
        }


        process.on('SIGINT', async () => {
            await statsStorage.updateAllStats(collector.allStats);
        });
    }
}

module.exports = App;