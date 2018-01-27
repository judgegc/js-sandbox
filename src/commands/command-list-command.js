const Services = require('./../services');

class CommandListCommand {
    constructor(args) {
        this.args = args;
    }

    execute(client, msg) {
        const resolveUsername = (userId) => {
            const userObj = client.users.get(userId);
            return userObj && userObj.tag || userId;
        };
        const cmdProc = Services.resolve('commandprocessor');
        const serverCommands = cmdProc.getCustomCommands(msg.guild.id);
        if (!(serverCommands && serverCommands.size > 0)) {
            return Promise.resolve('Nothing here');
        }

        if (!this.args.length) {
            return Promise
                .resolve([...serverCommands].map(cmd => `${cmd[0]} — ${resolveUsername(cmd[1].owner)} - ${cmd[1].desc ? cmd[1].desc : ''}`).join('\n'));
        }

        if (this.args.length >= 1 && this.args[0] === '--my') {
            return Promise
                .resolve([...serverCommands].filter(cmd => cmd[1].owner === msg.author.id).map(cmd => `${cmd[0]} — ${resolveUsername(cmd[1].owner)}`).join('\n'));
        }

        return Promise.reject();
    }
}

module.exports = CommandListCommand;