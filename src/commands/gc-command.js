class GcCommand {
    constructor(args) {
        this.args = args;
    }

    execute(client, msg) {
        msg.channel.fetchMessages({ limit: 100 })
            .then(ms => ms.filter(m => m.author.bot).forEach(m => m.delete().catch(e => e)));
        return Promise.reject();
    }
}

module.exports = GcCommand;