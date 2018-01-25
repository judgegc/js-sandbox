const settings = require('../settings.json');

const Services = require('./services');

const { JsSandboxCommand, GcCommand, MemoryUsageCommand, SayCommand, UnknownCommand, ReactCommand, ReactStrCommand, ServersCommand,
    SubscribeCommand, UnsubscribeCommand, ColorCommand, PinCommand, UnpinCommand, EmojiUsageStatsCommand,
    SaveCustomCommand, RemoveCustomCommand, CommandListCommand } = require('./commands');

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
        this.rNewLine = /\r\n|\r|\n/;
    }

    isCustomCmdSOurceCode(content) {
        const lines = content.split(this.rNewLine, 1);
        return lines.length && this.rCustomHeader.test(lines[0]);
    }

    process(command, serverId) {
        if (command.type === 'source_code' && settings['js-sandbox']['prefix'].includes(command.language)) {
            if (this.isCustomCmdSOurceCode(command.content)) {
                const lines = command.content.split(this.rNewLine, 2);
                if (lines.length === 2) {
                    const found = lines[1].match(this.rCustomName);
                    if (found) {
                        return new SaveCustomCommand([found[2], command.content]);
                    } else {
                        return new SayCommand(['Syntax error. Expected `\'cmd=name\'`']);
                    }
                }
            }
            return new JsSandboxCommand(command.content, [], settings['js-sandbox']['memory-limit']);
        } else if (command.type === 'command') {
            if (this._commands.hasOwnProperty(command.name)) {
                return new this._commands[command.name](command.args);
            }

            const serverCommands = this._customCommands.get(serverId);
            if (serverCommands) {
                const cmd = serverCommands.get(command.name);
                if (cmd) {
                    return new JsSandboxCommand(cmd.sourceCode, command.args, settings['js-sandbox']['memory-limit']);
                }
            }
        }
        return new UnknownCommand();
    }

    createCommand(server, name, owner, sourceCode) {
        const client = Services.resolve('client');
        const perUserLimit = settings['js-sandbox']['custom-commands-per-user'];
        const serverCommands = this._customCommands.get(server);
        if (serverCommands) {
            const command = serverCommands.get(name);
            if (command) {
                const ownerObj = client.users.get(command.owner);
                throw new Error(`Command '${name}' already owned by ${ownerObj ? ownerObj.username : owner}`);
            }
            if ([...serverCommands].filter(c => c[1].owner === owner).length >= perUserLimit) {
                throw Error(`Maximum number of commands per user has been reached. (${perUserLimit})`);
            }

            serverCommands.set(name, { owner, sourceCode });
        } else {
            this._customCommands.set(server, new Map([[name, { owner, sourceCode }]]));
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