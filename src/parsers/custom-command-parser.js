
class CustomCommandParser {
    constructor() {
        this._rCustomHeader = /^(['"])custom command\1;?$/;
        this._rCustomName = /^(['"])cmd=(\w+)\1;?$/;
        this._rCustomDesc = /^(['"])desc=(.+)\1;?$/;
        this._rNewLine = /\r\n|\r|\n/;
    }

    _cutHeaders(sourceCode, count) {
        let offset = 0;
        for (let nl = 0; nl < count; ++nl) {
            offset += sourceCode.substr(offset).search(this._rNewLine) + 1;
        }

        return sourceCode.substr(offset);
    }

    isCustomCmdSourceCode(content) {
        const lines = content.split(this._rNewLine, 1);
        return lines.length && this._rCustomHeader.test(lines[0]);
    }

    parse(content) {
        const lines = content.split(this._rNewLine, 3);
        if (lines.length < 2) {
            throw new Error('Syntax error. Expected `\'cmd=name\'`');
        }

        const cmdNameFound = lines[1].match(this._rCustomName);
        if (!cmdNameFound) {
            throw new Error('Syntax error. Expected `\'cmd=name\'`');
        }

        const descFound = lines[2].match(this._rCustomDesc);
        const description = descFound ? descFound[2] : '';

        const COMMAND_MAX_LENGTH = 16;
        if (cmdNameFound[2] > COMMAND_MAX_LENGTH) {
            return `Error. Custom command max length is: ${COMMAND_MAX_LENGTH}`;
        }

        return { name: cmdNameFound[2], description, sourceCode: this._cutHeaders(content, descFound? 3: 2) };
    }
}

module.exports = CustomCommandParser;