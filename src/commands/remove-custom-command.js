const settings = require('./../../settings.json');

class RemoveCustomCommand {
    constructor(args, customCommandManager) {
        this._args = args;
        this._customCommandManager = customCommandManager;
    }

    execute(client, msg) {
        if (this._args.length < 1) {
            return Promise.reject();
        }

        const owner = this._customCommandManager.getCommandOwner(msg.guild.id, this._args[0]);
        if (!owner) {
            return Promise.resolve(`Command '${this._args[0]}' not found`);
        }
        if (settings['super-admin'] === msg.author.id || msg.author.id === owner) {
            this._customCommandManager.removeCommand(msg.guild.id, this._args[0]);
        } else {
            const ownerObj = client.users.get(owner);
            return Promise.resolve(`It's not yours. '${this._args[0]}' owner is ${ownerObj ? ownerObj.username : owner}`);
        }
        return Promise.reject();
    }
}

module.exports = RemoveCustomCommand;