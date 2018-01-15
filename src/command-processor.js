const settings = require('../settings.json');

const JsSandboxCommand = require('./commands/js-sandbox-command');
const GcCommand = require('./commands/gc-command');
const MemoryUsageCommand = require('./commands/memory-usage-command');
const SayCommand = require('./commands/say-command');
const UnknownCommand = require('./commands/unknown-command');
const ReactCommand = require('./commands/react-command');
const ReactStrCommand = require('./commands/react-str-command');
const ServersCommand = require('./commands/servers-command');
const SubscribeCommand = require('./commands/subscribe-command');
const UnsubscribeCommand = require('./commands/unsubscribe-command');
const ColorCommand = require('./commands/color-command');
const PinCommand = require('./commands/pin-command');
const UnpinCommand = require('./commands/unpin-command');
const EmojiUsageStatsCommand = require('./commands/emoji-usage-stats-command');

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
            emjrating: EmojiUsageStatsCommand
        };
    }

    process(command) {
        if (command.type === 'source_code' && settings['js-sandbox']['prefix'].includes(command.language)) {
            return new JsSandboxCommand(command.content, settings['js-sandbox']['memory-limit']);
        } else if (command.type === 'command' && this._commands.hasOwnProperty(command.name)) {
            return new this._commands[command.name](command.args);
        }
        return new UnknownCommand();
    }

    get commands() {
        return this._commands;
    }
}

module.exports = CommandProcessor;