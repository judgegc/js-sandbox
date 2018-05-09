const StrToEmoji = require('./../str-to-emoji');

//         0 auto           1         2
//!react [channelId] [messageId] [text]
class ReactStrCommand {
    constructor(args) {
        this._args = args;
        this._converter = new StrToEmoji();
    }

    execute(client, msg) {
        if (this._args.length < 2) {
            return Promise.reject();
        }
        const idxOff = this._args.length < 3;

        const reactList = this._converter.convert(this._args[2 - idxOff]);
        const channel = idxOff ? msg.channel : client.channels.get(this._args[0]);
        if (channel) {
            channel.fetchMessage(this._args[1 - idxOff])
                .then(m => reactList.reduce((p, r) => p.then(() => m.react(r).catch(e => e)), Promise.resolve()))
                .catch(e => e);
        }
        return Promise.reject();
    }
}

module.exports = ReactStrCommand;