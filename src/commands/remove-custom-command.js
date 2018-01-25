const settings = require('./../../settings.json');
const Services = require('./../services');

class RemoveCustomCommand {
    constructor(args) {
        this.args = args;
    }

    execute(client, msg) {
        if (this.args.length < 1) {
            return Promise.reject();
        }

        const cmdProc = Services.resolve('commandprocessor');
        const owner = cmdProc.getCommandOwner(msg.guild.id, this.args[0]);
        if (!owner) {
            return Promise.resolve(`Command '${this.args[0]}' not found`);
        }
        if (settings['super-admin'] === msg.author.id || msg.author.id === owner) {
            cmdProc.removeCommand(msg.guild.id, this.args[0]);
        } else {
            const ownerObj = client.users.get(owner);
            return Promise.resolve(`It's not yours. '${this.args[0]}' owner is ${ownerObj ? ownerObj.username : owner}`);
        }
        return Promise.reject();
    }
}

module.exports = RemoveCustomCommand;