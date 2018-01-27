const CommandProcessor = require('./command-processor');

class PersistentCommandProcessor extends CommandProcessor {
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
                const server = this._customCommands.get(serverId);
                if (server) {
                    server.set(name, { owner: doc.owner, desc: doc.desc, sourceCode: doc.sourceCode });
                } else {
                    this._customCommands.set(serverId, new Map([[name, { owner: doc.owner, desc: doc.desc, sourceCode: doc.sourceCode }]]));
                }
            });
    }

    async createCommand(server, name, desc, owner, sourceCode) {
        super.createCommand(server, name, desc, owner, sourceCode);
        await this.storage.updateOne({ _id: this._hashIndex(server, name) }, { $set: { owner, desc, sourceCode } }, { upsert: true });
    }

    async removeCommand(serverId, name) {
        super.removeCommand(serverId, name);
        await this.storage.deleteOne({ _id: this._hashIndex(serverId, name) });
    }

    getCommandOwner(serverId, name) {
        const serverCommands = this._customCommands.get(serverId);
        if (serverId) {
            const cmdObj = serverCommands.get(name);
            return cmdObj && cmdObj.owner;
        }
        return undefined;
    }

    _hashIndex(server, name) {
        return `${server}${this.INDEX_DELIM}${name}`;
    }
}

module.exports = PersistentCommandProcessor;