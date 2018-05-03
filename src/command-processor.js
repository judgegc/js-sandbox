const settings = require('../settings.json');

const Services = require('./services');

const { JsSandboxCommand, GcCommand, MemoryUsageCommand, SayCommand, UnknownCommand, ReactCommand, ReactStrCommand, ServersCommand,
    SubscribeCommand, UnsubscribeCommand, ColorCommand, PinCommand, UnpinCommand, EmojiUsageStatsCommand,
    SaveCustomCommand, RemoveCustomCommand, CommandListCommand, CustomCommand } = require('./commands');

class CommandProcessor {
    constructor() {
        this._commands = {
            gc: GcCommand,
            mem: MemoryUsageCommand,
            say: SayCommand,
            react: ReactCommand,
            rstr: ReactStrCommand,
            servers: ServersCommand,
            sub: SubscribeCommand,
            unsub: UnsubscribeCommand,
            mycolor: ColorCommand,
            pin: PinCommand,
            unpin: UnpinCommand,
            emjrating: EmojiUsageStatsCommand,
            rmcmd: RemoveCustomCommand,
            cmdlist: CommandListCommand
        };
        this._customCommands = new Map();
        this.rCustomHeader = /^(['"])custom command\1;?$/;
        this.rCustomName = /^(['"])cmd=(\w+)\1;?$/;
        this.rCustomDesc = /^(['"])desc=(.+)\1;?$/;
        this.rNewLine = /\r\n|\r|\n/;
    }

    isCustomCmdSOurceCode(content) {
        const lines = content.split(this.rNewLine, 1);
        return lines.length && this.rCustomHeader.test(lines[0]);
    }

    process(command, serverId) {
        if (command.type === 'source_code' && settings['js-sandbox']['prefix'].includes(command.language.toLowerCase())) {
            if (this.isCustomCmdSOurceCode(command.content)) {
                const lines = command.content.split(this.rNewLine, 3);
                if (lines.length >= 2) {
                    const cmdNameFound = lines[1].match(this.rCustomName);
                    var descFound = lines[2].match(this.rCustomDesc);
                    if (!cmdNameFound) {
                        return new SayCommand(['Syntax error. Expected `\'cmd=name\'`']);
                    }
                    if (this._commands.hasOwnProperty(cmdNameFound[2])) {
                        return new SayCommand([`\`${cmdNameFound[2]}\` is reserved`]);
                    }
                    descFound = descFound ? descFound[2] : '';
                    return new SaveCustomCommand([cmdNameFound[2], descFound, command.content]);
                }
            }
            return new JsSandboxCommand(command.content, {}, []);
        } else if (command.type === 'command') {
            if (this._commands.hasOwnProperty(command.name)) {
                return new this._commands[command.name](command.args);
            }

            const serverCommands = this._customCommands.get(serverId);
            if (serverCommands) {
                const cmd = serverCommands.get(command.name);
                if (cmd) {
                    return new CustomCommand(cmd, command.args);
                }
            }
        }
        return new UnknownCommand();
    }

    createCommand(server, name, desc, owner, sourceCode) {
        const client = Services.resolve('client');
        const perUserLimit = settings['js-sandbox']['custom-commands-per-user'];
        const serverCommands = this._customCommands.get(server);
        if (serverCommands) {
            if ([...serverCommands].filter(c => c[1].owner === owner).length >= perUserLimit) {
                throw Error(`Maximum number of commands per user has been reached. (${perUserLimit})`);
            }

            serverCommands.set(name, { name, owner, desc, sourceCode, state: '' });
        } else {
            this._customCommands.set(server, new Map([[name, { name, owner, desc, sourceCode, state: '' }]]));
        }
    }

    removeCommand(serverId, name) {
        const serverCommands = this._customCommands.get(serverId);
        if (serverCommands) {
            serverCommands.delete(name);
        }
    }

    hasCustomCommand(server, name) {
        const commands = this._customCommands.get(server);
        return commands && commands.has(name);
    }

    getCustomCommands(serverId) {
        return this._customCommands.get(serverId);
    }

    get commands() {
        return this._commands;
    }
}

module.exports = CommandProcessor;