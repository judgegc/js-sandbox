const Util = require('./../util');

class PinCommand {
    constructor(args) {
        this._args = args;
    }

    async execute(client, msg) {
        if (this._args.length < 1) {
            return Promise.reject();
        }

        const messageId = (this._args.length > 1 || !Util.isInteger(this._args[0])) ? msg.id : this._args[0];

        const pinMessage = await msg.channel.fetchMessage(messageId);
        await pinMessage.pin();

        return Promise.reject();
    }
}

module.exports = PinCommand;