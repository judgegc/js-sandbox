const JsSandboxCommand = require('./js-sandbox-command');
const ResponseSizeFilter = require('./../filters/response-size-filter');
const Util = require('./../util');

const Services = require('./../services');

class CustomCommand {
    constructor(command, args) {
        this._command = command;
        this._args = args;
        this._sandboxManager = Services.resolve('sandboxmanager');
        this._commandProc = Services.resolve('commandprocessor');
    }

    async execute(client, msg) {
        const stateHash = Util.md5(this._command.state);
        const result = await this._sandboxManager.send(this._command.sourceCode, JsSandboxCommand.buildExternal(client, msg), this._command.state, this._args);

        this._command.state = result.state;

        if (stateHash !== Util.md5(result.state)) {
            this._commandProc.saveState(msg.guild.id, this._command);
        }

        const filtered = new ResponseSizeFilter(result.response).filter();
        if (!filtered) {
            throw undefined;
        }
        return filtered;
    }
}

module.exports = CustomCommand;