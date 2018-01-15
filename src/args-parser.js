class ArgsParser {
    constructor() {
    }

    _tokenize(argsStr) {
        const tokens = [];
        let token = '';
        let quotesMode = false;

        if (!argsStr) {
            return [];
        }

        argsStr.split('').forEach((c, i, args) => {
            if (c === '"' && args[i - 1] === '\\') {
                token += c;
            }
            else if (c === '"') {
                if (quotesMode) {
                    if (token) {
                        tokens.push(token);
                    }
                    token = '';
                }
                quotesMode = !quotesMode;
            }
            else if (c === ' ' && !quotesMode) {
                if (token) {
                    tokens.push(token);
                    token = '';
                }
            }
            else {
                token += c;
            }
        });

        if (token) {
            tokens.push(token);
        }
        return tokens;
    }

    parse(str) {
        return this._tokenize(str);
    }
}

module.exports = ArgsParser;