const settings = require('../settings.json');

class CustomCommandsManager {
    constructor() {
        this._customCommands = new Map();
        this.emptyState = JSON.stringify({});
    }

    createCommand(server, name, desc, owner, sourceCode) {
        const perUserLimit = settings['js-sandbox']['custom-commands-per-user'];
        const serverCommands = this._customCommands.get(server);

        if (serverCommands) {
            if ([...serverCommands].filter(c => c[1].owner === owner).length >= perUserLimit) {
                throw Error(`Maximum number of commands per user has been reached. (${perUserLimit})`);
            }

            serverCommands.set(name, { name, owner, desc, sourceCode, state: this.emptyState });
        } else {
            this._customCommands.set(server, new Map([[name, { name, owner, desc, sourceCode, state: this.emptyState }]]));
        }
    }

    removeCommand(serverId, name) {
        const serverCommands = this._customCommands.get(serverId);
        if (serverCommands) {
            serverCommands.delete(name);
        }
    }

    hasCommand(server, name) {
        const commands = this._customCommands.get(server);
        return commands && commands.has(name);
    }

    getCommands(serverId) {
        return this._customCommands.get(serverId) || null;
    }

    getCommand(serverId, command) {
        const serverCmds = this.getCommands(serverId);
        return serverCmds && serverCmds.get(command) || null;
    }

    getCommandOwner(serverId, name) {
        const cmd = this.getCommand(serverId, name);
        return cmd ? cmd.owner : null;
    }
}

module.exports = CustomCommandsManager;