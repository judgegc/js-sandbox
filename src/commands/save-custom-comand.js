const Services = require('./../services');

class SaveCustomCommand {
    constructor(args) {
        this.args = args;
    }

    async execute(client, msg) {
        const COMMAND_MAX_LENGTH = 16;
        if (this.args[0].length > COMMAND_MAX_LENGTH) {
            return `Error. Custom command max length is: ${COMMAND_MAX_LENGTH}`;
        }

        try {
            await Services
                .resolve('commandprocessor')
                .createCommand(msg.guild.id, this.args[0], this.args[1], msg.author.id, this.args[2]);
        } catch (e) {
            return e.message;
        }
        throw undefined;
    }
}

module.exports = SaveCustomCommand;