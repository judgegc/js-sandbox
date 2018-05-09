const CustomEmojiFilter = require('./../filters/custom-emoji-filter');
//         0         1
//!say [channelId] [msg]
class SayCommand {
    constructor(args) {
        this._args = args;
    }

    execute(client, msg) {
        if (this._args.length < 1) {
            return Promise.reject();
        }

        const channel = this._args.length === 2 ? client.channels.get(this._args[0]) : msg.channel;
        if (channel) {
            channel.send(new CustomEmojiFilter(this._args[this._args.length - 1]).filter(client.guilds, msg.guild.id)).catch(e => e);
        }
        return Promise.reject();
    }
}

module.exports = SayCommand;