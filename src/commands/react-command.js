const settings = require('./../../settings.json');
const CustomEmojiFilter = require('./../filters/custom-emoji-filter');
const Util = require('./../util');

//         0 auto         1          2
//!react [channelId] [messageId] [reaction]
class ReactCommand {
    constructor(args) {
        this.args = args;
    }

    execute(client, msg) {
        if (this.args.length < 2) {
            return Promise.reject();
        }
        const idxOff = this.args.length < 3;

        const channel = idxOff ? msg.channel : client.channels.get(this.args[0]);
        if (channel) {
            channel.fetchMessage(this.args[1 - idxOff])
                .then(m => m
                    .react(new CustomEmojiFilter(this.args[2 - idxOff]).filter(client.guilds, msg.guild.id).slice(1, -1))
                    .catch(e => e))
                .catch(e => e);
        }
        return Promise.reject();
    }
}

module.exports = ReactCommand;