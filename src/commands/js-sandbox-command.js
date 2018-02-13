const Services = require('./../services');
const Discord = require('discord.js');

const Util = require('./../util');
const ResponseSizeFilter = require('./../filters/response-size-filter');

class JsSandboxCommand {
    constructor(sourceCode, state, args) {
        this.sourceCode = sourceCode;
        this._state = state;
        this._args = args;
        this._sandboxManager = Services.resolve('sandboxmanager');
    }

    execute(client, msg) {
        return this._sandboxManager.send(this.sourceCode, JsSandboxCommand.buildExternal(client, msg), this._state, this._args).then(result => {
            const filtered = new ResponseSizeFilter(result.response).filter();
            if (!filtered) {
                return Promise.reject();
            }
            return Promise.resolve(filtered);
        });
    }

    static buildExternal(client, msg) {
        const external = {};
        const members = [];

        if (Util.isGuildTextChannel(msg)) {
            msg.channel.guild.members.forEach(m => members.push({
                id: m.user.id,
                bot: m.user.bot,
                username: m.user.username,
                displayName: m.displayName,
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

            const channels = [...msg.guild.channels]
                .filter(c => ['text', 'voice'].indexOf(c[1].type) >= 0)
                .map(c => ({ id: c[0], name: c[1].name, type: c[1].type, createdTimestamp: c[1].createdTimestamp }));

            const roles = [...msg.channel.guild.roles.filter(r => r.name !== '@everyone')].map(r => ({
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
            }));
            Object.assign(external, { members, channels, roles });
        }
        const channel = { id: msg.channel.id, name: msg.channel.name, nsfw: msg.channel.nsfw };
        const author = { username: msg.author.username, id: msg.author.id, discriminator: msg.author.discriminator, bot: msg.author.bot };

        Object.assign(external, { channel, author });
        return external;
    }

    static _readablePermissions(permissions) {
        const pObj = new Discord.Permissions(permissions).serialize();
        return Object.keys(pObj).filter(pk => pObj[pk]);
    }
}

module.exports = JsSandboxCommand;