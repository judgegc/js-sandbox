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
        const id = this._commandHash(serverId, command);

        if (changes.created) {
            bulk.push({ updateOne: { filter: { _id: id }, update: { $set: { users: [], groups: [] } }, upsert: true } });
        }
        if (changes.add.users.length > 0) {
            bulk.push({ updateOne: { filter: { _id: id }, update: { $push: { users: { $each: changes.add.users } } }, upsert: true } });
        }
        if (changes.add.groups.length > 0) {
            bulk.push({ updateOne: { filter: { _id: id }, update: { $push: { groups: { $each: changes.add.groups } } }, upsert: true } });
        }
        if (changes.remove.users.length > 0) {
            bulk.push({ updateOne: { filter: { _id: id }, update: { $pullAll: { users: changes.remove.users } }, upsert: true } });
        }
        if (changes.remove.groups.length > 0) {
            bulk.push({ updateOne: { filter: { _id: id }, update: { $pullAll: { groups: changes.remove.groups } }, upsert: true } });
        }

        await this.storage.bulkWrite(bulk);
    }
}

module.exports = PersistentExecutionPolicy;