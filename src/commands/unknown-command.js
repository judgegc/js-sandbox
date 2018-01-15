class UnknownCommand {
    constructor() {
    }

    execute(client, msg) {
        return Promise.reject();
    }
}

module.exports = UnknownCommand;