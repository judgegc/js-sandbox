const settings = require('../settings.json');
const Services = require('./services');
const Util = require('./util');

class ExecutionPolicy {
    constructor(commands) {
        this.collection = 'execution_policy';
        this.comamnds = commands;
        this.superAdmin = settings['super-admin'];
        this.permissions = new Map();
        this.INDEX_DELIM = '_';
    }

    async loadPermissions() {
        this.permissions = new Map((await Services.resolve('storage').collection(this.collection)
            .find()
            .toArray())
            .map(p => [p._id, { users: p.users, groups: p.groups }]));
    }

    _commandHash(server, command) {
        return server + this.INDEX_DELIM + command;
    }

    _isSubjectsEmpty(subjects) {
        return subjects.users.length === 0 && subjects.groups.length === 0;
    }

    /**
    * Change policy
    * @param {string} serverId
    * @param {string} command
    * @typedef {{users: string[], groups: string[]}} Subjects
    * @param {{add: Subjects, remove: Subjects} options
    */
    async change(serverId, command, options) {
        const isAddEmpty = this._isSubjectsEmpty(options.add);
        const isRemoveEmpty = this._isSubjectsEmpty(options.remove);
        if (isAddEmpty && isRemoveEmpty)
            return;

        const cmdHash = this._commandHash(serverId, command);
        let foundPolicy = this.permissions.get(cmdHash);

        if (!foundPolicy && isAddEmpty)
            return;

        const bulk = [];
        if (!foundPolicy) {
            foundPolicy = { users: [], groups: [] };
            this.permissions.set(cmdHash, foundPolicy);
            bulk.push({ updateOne: { filter: { _id: cmdHash }, update: { $set: { users: [], groups: [] } }, upsert: true } });
        }

        const dupUsers = options.add.users.filter(x => options.remove.users.indexOf(x) != -1);
        const dupGroups = options.add.groups.filter(x => options.remove.groups.indexOf(x) != -1);

        options.add.users = options.add.users.filter(x => !dupUsers.includes(x));
        options.remove.users = options.remove.users.filter(x => !dupUsers.includes(x));

        options.add.groups = options.add.groups.filter(x => !dupGroups.includes(x));
        options.remove.groups = options.remove.groups.filter(x => !dupGroups.includes(x));

        const users = new Set(foundPolicy.users);
        const groups = new Set(foundPolicy.groups);

        const addedUsers = [];
        for (const au of options.add.users) {
            if (!users.has(au))
                addedUsers.push(au);
        }
        foundPolicy.users.push.apply(foundPolicy.users, addedUsers);

        const addedGroups = [];
        for (const ag of options.add.groups) {
            if (!groups.has(ag))
                addedGroups.push(ag);
        }
        foundPolicy.groups.push.apply(foundPolicy.groups, addedGroups);

        const removedUsers = new Set(options.remove.users);
        const removedGroups = new Set(options.remove.groups);

        foundPolicy.users = foundPolicy.users.filter(x => !removedUsers.has(x));
        foundPolicy.groups = foundPolicy.groups.filter(x => !removedGroups.has(x));

        addedUsers.length > 0 && bulk.push({ updateOne: { filter: { _id: cmdHash }, update: { $push: { users: { $each: addedUsers } } }, upsert: true } });
        addedGroups.length > 0 && bulk.push({ updateOne: { filter: { _id: cmdHash }, update: { $push: { groups: { $each: addedGroups } } }, upsert: true } });
        removedUsers.length > 0 && bulk.push({ updateOne: { filter: { _id: cmdHash }, update: { $pullAll: { users: removedUsers } }, upsert: true } });
        removedGroups.length > 0 && bulk.push({ updateOne: { filter: { _id: cmdHash }, update: { $pullAll: { groups: removedGroups } }, upsert: true } });

        Services.resolve('storage').collection(this.collection).bulkWrite(bulk);
    }

    check(msg, command) {
        if (command.type !== 'command') {
            return true;
        }

        if (msg.author.id === this.superAdmin) {
            return true;
        }

        const commandPermissions = this.permissions.get(this._commandHash(msg.channel.guild.id, command.name));
        if (!commandPermissions) {
            return false;
        }

        return commandPermissions.users.includes(msg.author.id) ||
            commandPermissions.groups.some(gid => msg.channel.guild.members.get(msg.author.id).roles.map(r => r.id).includes(gid));
    }
}

module.exports = ExecutionPolicy;