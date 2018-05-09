class CommandListCommand {
    constructor(args, customCommandManager) {
        this._args = args;
        this._customCommandManager = customCommandManager;
    }

    execute(client, msg) {
        const resolveUsername = (userId) => {
            const userObj = client.users.get(userId);
            return userObj && userObj.tag || userId;
        };
        const serverCommands = this._customCommandManager.getCommands(msg.guild.id);
        if (!(serverCommands && serverCommands.size > 0)) {
            return Promise.resolve('Nothing here');
        }

        if (!this._args.length) {
            return Promise
                .resolve(
                    [...serverCommands]
                        .map(cmd => `${cmd[0]} — ${resolveUsername(cmd[1].owner)}${cmd[1].desc ? ' - ' + cmd[1].desc : ''}`)
                        .join('\n'));
        }

        if (this._args.length >= 1 && this._args[0] === '--my') {
            return Promise
                .resolve(
                    [...serverCommands]
                        .filter(cmd => cmd[1].owner === msg.author.id)
                        .map(cmd => `${cmd[0]} — ${resolveUsername(cmd[1].owner)}${cmd[1].desc ? ' - ' + cmd[1].desc : ''}`).join('\n'));
        }

        return Promise.reject();
    }
}

module.exports = CommandListCommand;
