const Util = require('./../util');

class UnsubscribeCommand {
    constructor(args) {
        this.args = args;
    }

    _unsubscribeAll(msg) {
        [...msg.channel.guild.channels]
            .map(x => x[1])
            .filter(c => c.position !== 0)
            .map(c => {
                const permissions = c.permissionOverwrites.get(msg.author.id);
                if (permissions) {
                    permissions.delete().catch(e => e);
                }
            });
    }

    execute(client, msg) {
        if (Util.isDmMsg(msg)) {
            return Promise.reject();
        }

        if (this.args.length < 1) {
            return Promise.reject();
        }

        if (this.args[0] === '--all') {
            this._unsubscribeAll(msg);
            return Promise.reject();
        }

        const channelName = this.args[0];
        const channel = [...msg.channel.guild.channels].map(x => x[1]).find(c => c.name === channelName);
        if (channel && channel.position !== 0) {
            const permissions = channel.permissionOverwrites.get(msg.author.id);
            if (permissions) {
                permissions.delete().catch(e => e);
            }
        }
        return Promise.reject();
    }
}

module.exports = UnsubscribeCommand;