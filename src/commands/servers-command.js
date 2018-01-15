class ServersCommand {
    constructor(args) {
        this.args = args;
    }

    execute(client, msg) {
        return new Promise((resolve, reject) => {
            resolve([...client.guilds].map(s => s[1].name).join('\n'));
        });
    }
}

module.exports = ServersCommand;