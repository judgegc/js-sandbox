const { CustomCommand, UnknownCommand } = require('./commands');

class CommandProcessor {
    constructor(commandFactory, sandBoxManager, customCommandManager) {
        this._commandFactory = commandFactory;
        this._sandboxManager = sandBoxManager;
        this._customCommandManager = customCommandManager;
    }

    process(command, serverId) {
        if (this._commandFactory.has(command.name)) {
            return this._commandFactory.create(command.name, command.args);
        }

        const ccmd = this._customCommandManager.getCommand(serverId, command.name);
        return ccmd ?
            new CustomCommand(ccmd, command.args, this._sandboxManager, this._customCommandManager) :
            new UnknownCommand();
    }
}

module.exports = CommandProcessor;