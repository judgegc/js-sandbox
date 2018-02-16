const settings = require('./../../settings.json');
const StrToEmoji = require('./../str-to-emoji');
const Util = require('./../util');

//         0 auto           1         2
//!react [channelId] [messageId] [text]
class ReactStrCommand {
    constructor(args) {
        this.args = args;
        this.converter = new StrToEmoji();
    }

    execute(client, msg) {
        if (this.args.length < 2) {
            return Promise.reject();
        }
        const idxOff = this.args.length < 3;

        const reactList = this.converter.convert(this.args[2 - idxOff]);
        const channel = idxOff ? msg.channel : client.channels.get(this.args[0]);
        if (channel) {
            channel.fetchMessage(this.args[1 - idxOff])
                .then(m => reactList.reduce((p, r) => p.then(() => m.react(r).catch(e => e)), Promise.resolve()))
                .catch(e => e);
        }
        return Promise.reject();
    }
}

module.exports = ReactStrCommand;