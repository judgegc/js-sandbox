const ServerInfoExtractor = require('./../server-info-extractor');
const ResponseSizeFilter = require('./../filters/response-size-filter');
const Util = require('./../util');

class CustomCommand {
    constructor(command, args, sandboxManager, customCommandManager) {
        this._command = command;
        this._args = args;
        this._sandboxManager = sandboxManager;
        this._customCommandManager = customCommandManager;
    }

    async execute(client, msg) {
        const externals = ServerInfoExtractor.extract(msg);
        const result = await this._sandboxManager.send(this._command.sourceCode, externals, this._command.state, this._args);

        const stateHash = Util.md5(this._command.state);
        if (result.state !== undefined && stateHash !== Util.md5(result.state)) {
            this._command.state = result.state;
            this._customCommandManager.saveState(msg.guild.id, this._command);
        }

        const filtered = new ResponseSizeFilter(result.response).filter();
        if (!filtered) {
            throw undefined;
        }
        return filtered;
    }
}

module.exports = CustomCommand;