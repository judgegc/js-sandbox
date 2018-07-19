const ArgsParser = require('./args-parser');
const settings = require('./../settings.json');
const Util = require('./util');

class MessageParser {
    constructor() {
        const prefix = Util.escapeRegExp(settings['commands-prefix']);
        this._cmdPattern = new RegExp(`^${prefix}(\\w+)(?: ([\\w\\W]+))?$`);
        this._argsParser = new ArgsParser();
    }
    parse(msg) {
        let found = null;
        if (found = msg.match(/```([a-zA-Z]*)\n([\s\S]*?)\n```/)) {
            return { type: 'source_code', language: found[1], content: found[2] };
        } else if (found = msg.match(this._cmdPattern)) {
            return { type: 'command', name: found[1], args: this._argsParser.parse(found[2]) };
        }
        return { type: 'unknown', content: msg };
    }
}

module.exports = MessageParser;