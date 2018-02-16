const Util = require('./../util');

class UnpinCommand {
    constructor(args) {
        this.args = args;
    }

    async execute(client, msg) {
        if (this.args.length < 1 || !Util.isInteger(this.args[0])) {
            return Promise.reject();
        }

        const pinMessage = await msg.channel.fetchMessage(this.args[0]);
        await pinMessage.unpin();

        return Promise.reject();
    }
}

module.exports = UnpinCommand;