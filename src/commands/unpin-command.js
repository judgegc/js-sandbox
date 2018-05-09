const Util = require('./../util');

class UnpinCommand {
    constructor(args) {
        this._args = args;
    }

    async execute(client, msg) {
        if (this._args.length < 1 || !Util.isInteger(this._args[0])) {
            return Promise.reject();
        }

        const pinMessage = await msg.channel.fetchMessage(this._args[0]);
        await pinMessage.unpin();

        return Promise.reject();
    }
}

module.exports = UnpinCommand;