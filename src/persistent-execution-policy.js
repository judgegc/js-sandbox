const ExecutionPolicy = require('./execution-policy');

class PersistentExecutionPolicy extends ExecutionPolicy {
    constructor(db) {
        super();
        this.storage = db.collection('execution_policy');
    }

    async loadPermissions() {
        this.permissions = new Map((await this.storage.find().toArray())
            .map(p => [p._id, { users: p.users, groups: p.groups }]));
    }

    async change(serverId, command, options) {
        const bulk = [];
        const changes = super.change(serverId, command, options);
        const cmdHash = this._commandHash(serverId, command);

        changes.created && bulk.push({ updateOne: { filter: { _id: cmdHash }, update: { $set: { users: [], groups: [] } }, upsert: true } });
        changes.add.users.length > 0 && bulk.push({ updateOne: { filter: { _id: cmdHash }, update: { $push: { users: { $each: changes.add.users } } }, upsert: true } });
        changes.add.groups.length > 0 && bulk.push({ updateOne: { filter: { _id: cmdHash }, update: { $push: { groups: { $each: changes.add.groups } } }, upsert: true } });
        changes.remove.users.length > 0 && bulk.push({ updateOne: { filter: { _id: cmdHash }, update: { $pullAll: { users: changes.remove.users } }, upsert: true } });
        changes.remove.groups.length > 0 && bulk.push({ updateOne: { filter: { _id: cmdHash }, update: { $pullAll: { groups: changes.remove.groups } }, upsert: true } });

        await this.storage.bulkWrite(bulk);
    }
}

module.exports = PersistentExecutionPolicy;