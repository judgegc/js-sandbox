const colors = require('color-name');

class ColorCommand {
    constructor(args) {
        this._args = args;
    }

    _genRoleName(userId) {
        return 'color_' + userId;
    }

    _parseColor(color) {
        if (color[0] === '#') {
            return Number.parseInt(color.substring(1), 16) || undefined;
        } else {
            const rgbFromName = colors[color];
            return rgbFromName && (rgbFromName[0] << 16) + (rgbFromName[1] << 8) + rgbFromName[2];
        }
    }

    _findColorRole(msg) {
        return [...msg.channel.guild.roles].map(r => r[1]).find(r => r.name === this._genRoleName(msg.author.id));
    }

    execute(client, msg) {
        if (this._args.length < 1) {
            return Promise.reject();
        }

        if (this._args[0] === '--purge') {
            const colorRole = this._findColorRole(msg);
            if (colorRole) {
                colorRole.delete().catch(e => e);
            }
            return Promise.reject();
        }

        const color = this._parseColor(this._args[0]);
        if (!color) {
            return Promise.reject();
        }

        const curRole = this._findColorRole(msg);
        const botRole = [...msg.channel.guild.members.get(client.user.id).roles].map(r => r[1]).find(r => r.managed);

        if (curRole) {
            curRole.setColor(color).catch(e => e);
        } else {
            msg.channel.guild.createRole({ name: this._genRoleName(msg.author.id), color, position: botRole.calculatedPosition, permissions: 0 })
                .then(r => msg.channel.guild.members.get(msg.author.id).addRole(r).catch(e => e))
                .catch(e => e);
        }

        return Promise.reject();
    }
}

module.exports = ColorCommand;