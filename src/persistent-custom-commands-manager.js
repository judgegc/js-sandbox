const CustomCommandsManager = require('./custom-commands-manager');

class PersistentCustomCommandsManager extends CustomCommandsManager {
    constructor(storage) {
        super();
        this.INDEX_DELIM = '_';
        this.storage = storage.collection('custom_commands');
    }

    async loadCustomCommands() {
        this._customCommands = new Map();
        (await this.storage.find().toArray())
            .forEach(doc => {
                const [serverId, name] = doc._id.split(this.INDEX_DELIM);
                const serverCommands = this._customCommands.get(serverId);
                const cmd = { name, owner: doc.owner, desc: doc.desc, sourceCode: doc.sourceCode, state: doc.state };

                if (serverCommands) {
                    serverCommands.set(name, cmd);
                } else {
                    this._customCommands.set(serverId, new Map([[name, cmd]]));
                }
            });
    }

    async createCommand(server, owner, name, desc, sourceCode) {
        super.createCommand(server, name, desc, owner, sourceCode);
        await this.storage.updateOne(
            { _id: this._hashIndex(server, name) },
            { $set: { owner, desc, sourceCode, state: this.emptyState } },
            { upsert: true });
    }

    async removeCommand(serverId, name) {
        super.removeCommand(serverId, name);
        await this.storage.deleteOne({ _id: this._hashIndex(serverId, name) });
    }

    async saveState(serverId, command) {
        await this.storage.updateOne({ _id: this._hashIndex(serverId, command.name) }, { $set: { state: command.state } });
    }

    _hashIndex(server, name) {
        return `${server}${this.INDEX_DELIM}${name}`;
    }
}

module.exports = PersistentCustomCommandsManager;