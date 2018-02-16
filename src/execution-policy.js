const settings = require('../settings.json');
const Services = require('./services');
const Util = require('./util');

class ExecutionPolicy {
    constructor(commands) {
        this.collection = 'execution_policy';
        this.comamnds = commands;
        this.superAdmin = settings['super-admin'];
        this.permissions = new Map();
    }
    async loadPermissions() {
        this.permissions = new Map((await Services.resolve('storage').collection(this.collection)
            .find()
            .toArray())
            .map(p => [this._commandHash(p.server, p.command), { users: p.users, groups: p.groups }]));
    }
    _commandHash(server, command) {
        return server + command;
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