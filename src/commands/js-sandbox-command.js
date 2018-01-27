const childProcess = require('child_process');
const JsSandbox = require('./../js-sandbox/js-sandbox');
const Discord = require('discord.js');

class JsSandboxCommand {
    constructor(code, args, memoryLimit) {
        this.sandbox = new JsSandbox(code, args, memoryLimit);
    }

    _readablePermissions(permissions) {
        const pObj = new Discord.Permissions(permissions).serialize();
        return Object.keys(pObj).filter(pk => pObj[pk]);
    }

    execute(client, msg) {
        const members = [];
        if (msg.channel.type !== 'dm') {
            msg.channel.guild.members.forEach(m => members.push({
                id: m.user.id,
                bot: m.user.bot,
                username: m.user.username,
                game: m.user.presence.game && m.user.presence.game.name,
                tag: m.user.tag,
                status: m.user.presence.status,
                discriminator: m.user.discriminator,
                joinedTimestamp: m.joinedTimestamp,
                roles: m.roles
                    .filter(r => r.name !== '@everyone')
                    .map(r => ({
                        color: r.color,
                        createdTimestamp: r.createdTimestamp,
                        editable: r.editable,
                        hexColor: r.hexColor,
                        hoist: r.hoist,
                        id: r.id,
                        managed: r.managed,
                        mentionable: r.mentionable,
                        name: r.name,
                        permissions: r.permissions,
                        position: r.position
                    }))
            }));
            this.sandbox.pushData('members', members);

            const channels = [...msg.guild.channels]
                .filter(c => ['text', 'voice'].indexOf(c[1].type) >= 0)
                .map(c => ({ id: c[0], name: c[1].name, type: c[1].type, createdTimestamp: c[1].createdTimestamp }));
            this.sandbox.pushData('channels', channels);

            this.sandbox.pushData('roles', [...msg.channel.guild.roles.filter(r => r.name !== '@everyone')].map(r => ({
                color: r[1].color,
                createdTimestamp: r[1].createdTimestamp,
                editable: r[1].editable,
                hexColor: r[1].hexColor,
                hoist: r[1].hoist,
                id: r[1].id,
                managed: r[1].managed,
                mentionable: r[1].mentionable,
                name: r[1].name,
                permissions: r[1].permissions,
                readablePermissions: this._readablePermissions(r[1].permissions),
                position: r[1].position
            })));
        }
        this.sandbox.pushData('channel', { id: msg.channel.id, name: msg.channel.name, nsfw: msg.channel.nsfw });
        this.sandbox.pushData('author', { username: msg.author.username, id: msg.author.id, discriminator: msg.author.discriminator, bot: msg.author.bot });
        return this.sandbox.execute();
    }
}

module.exports = JsSandboxCommand;