const Util = require('./../util');

class PinCommand {
    constructor(args) {
        this.args = args;
    }

    async execute(client, msg) {
        if (Util.isDmMsg(msg)) {
            return Promise.reject();
        }

        if (this.args.length < 1) {
            return Promise.reject();
        }

        const messageId = (this.args.length > 1 || !Util.isInteger(this.args[0])) ? msg.id : this.args[0];

        const pinMessage = await msg.channel.fetchMessage(messageId);
        await pinMessage.pin();

        return Promise.reject();
    }
}

module.exports = PinCommand;