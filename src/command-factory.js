const { GcCommand, MemoryUsageCommand, SayCommand, ReactCommand, ReactStrCommand, ServersCommand,
    SubscribeCommand, UnsubscribeCommand, ColorCommand, PinCommand, UnpinCommand, EmojiUsageStatsCommand,
    RemoveCustomCommand, CommandListCommand } = require('./commands');

class CommandFactory {
    constructor(customCommandmanager, emjCollector) {
        this._customCommandManager = customCommandmanager;
        this._emjCollector = emjCollector;
        this._commands = {
            gc: { class: GcCommand },
            mem: { class: MemoryUsageCommand },
            say: { class: SayCommand },
            react: { class: ReactCommand },
            rstr: { class: ReactStrCommand },
            servers: { class: ServersCommand },
            sub: { class: SubscribeCommand },
            unsub: { class: UnsubscribeCommand },
            mycolor: { class: ColorCommand },
            pin: { class: PinCommand },
            unpin: { class: UnpinCommand },
            emjrating: { class: EmojiUsageStatsCommand, params: [this._emjCollector] },
            rmcmd: { class: RemoveCustomCommand, params: [this._customCommandManager] },
            cmdlist: { class: CommandListCommand, params: [this._customCommandManager] }
        };
    }
    create(command, args) {
        if (this._commands.hasOwnProperty(command)) {
            const prot = this._commands[command];
            const cmdClass = prot.hasOwnProperty('params') ?
                prot.class.bind.apply(prot.class, [null, args, ...prot.params]) :
                prot.class.bind(prot.class, args);
            return new cmdClass();
        }
        return null;
    }

    has(command) {
        return this._commands.hasOwnProperty(command);
    }
}

module.exports = CommandFactory;