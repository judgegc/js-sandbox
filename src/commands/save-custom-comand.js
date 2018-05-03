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

        const cmdProc = Services.resolve('commandprocessor');

        try {
            const commands = cmdProc.getCustomCommands(msg.guild.id);

            if (commands !== undefined && commands.size > 0) {
                const name = this.args[0];
                const foundCmd = commands.get(name);

                if (foundCmd && msg.author.id !== foundCmd.owner) {
                    const ownerObj = client.users.get(foundCmd.owner);
                    throw new Error(`Command '${name}' already owned by ${ownerObj ? ownerObj.username : foundCmd.owner}`);
                }
            }

            await cmdProc.createCommand(msg.guild.id, this.args[0], this.args[1], msg.author.id, this.args[2]);
        } catch (e) {
            return e.message;
        }
        throw undefined;
    }
}

module.exports = SaveCustomCommand;