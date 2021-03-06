class SubscribeCommand {
    constructor(args) {
        this._args = args;
        this._permissions = {
            READ_MESSAGES: true,
            SEND_MESSAGES: true
        };
    }

    _subscribe(user, channel) {
        const lockedRole = [...channel.guild.roles].map(r => r[1]).find(r => r.name === 'locked');
        if (lockedRole) {
            const permission = channel.permissionOverwrites.get(lockedRole.id);
            if (permission) {
                return;
            }

            channel.overwritePermissions(user, this._permissions).catch(e => e);
        }
    }

    _subscribeAll(msg) {
        [...msg.channel.guild.channels]
            .map(x => x[1])
            .filter(c => c.position !== 0)
            .map(c => this._subscribe(msg.author, c));
    }

    execute(client, msg) {
        if (this._args.length < 1) {
            return Promise.reject();
        }

        if (this._args[0] === '--all') {
            this._subscribeAll(msg);
            return Promise.reject();
        }

        const channelName = this._args[0];
        const channel = [...msg.channel.guild.channels].map(x => x[1]).find(c => c.name === channelName);
        if (channel) {
            this._subscribe(msg.author, channel);
        }
        return Promise.reject();
    }
}

module.exports = SubscribeCommand;