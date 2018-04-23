const CustomEmojiFilter = require('./../filters/custom-emoji-filter');
const settings = require('./../../settings.json');
//         0         1
//!say [channelId] [msg]
class SayCommand {
    constructor(args) {
        this.args = args;
    }

    execute(client, msg) {
        if (this.args.length < 1) {
            return Promise.reject();
        }

        const channel = this.args.length === 2 ? client.channels.get(this.args[0]) : msg.channel;
        if (channel) {
            channel.send(new CustomEmojiFilter(this.args[this.args.length - 1]).filter(client.guilds, msg.guild.id)).catch(e => e);
        }
        return Promise.reject();
    }
}

module.exports = SayCommand;