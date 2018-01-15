const CustomEmojiFilter = require('./../filters/custom-emoji-filter');
const settings = require('./../../settings.json');
//         0         1
//!say [channelId] [msg]
class SayCommand {
    constructor(args) {
        this.args = args;
    }

    execute(client, msg) {
        if (this.args.length < 2) {
            return Promise.reject();
        }
        const channel = client.channels.get(this.args[0]);
        if (channel) {
            channel.send(new CustomEmojiFilter(this.args[1]).filter(client, msg)).catch(e => e);
        }
        return Promise.reject();
    }
}

module.exports = SayCommand;