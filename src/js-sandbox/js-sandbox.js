const childProcess = require('child_process');
const ResponseSizeFilter = require('./../filters/response-size-filter');

class JsSandbox {
    constructor(code, args, memoryLimit) {
        this.code = code;
        this.memoryLimit = Number.parseInt(memoryLimit);
        this.data = { args };
    }
    pushData(name, val) {
        this.data[name] = val;
    }
    _executeInSandbox(cb) {
        const sandbox = childProcess.fork('src/js-sandbox/sandbox.js', { execArgv: ['--max-old-space-size=' + this.memoryLimit], detached: true });
        sandbox.on('message', response => {
            const filtered = new ResponseSizeFilter(response).filter();
            if (filtered) {
                cb(filtered);
            }
        });

        sandbox.on('close', (exitCode) => {
            if (exitCode || exitCode === null) {
                cb('Error: Sandbox memory limit reached');//code == 3
            }
        });
        sandbox.send({ type: 'external_data', data: this.data });
        sandbox.send({ type: 'source_code', data: this.code });
    }

    execute() {
        return new Promise((resolve, reject) => {
            this._executeInSandbox(resolve);
        });
    }
}

module.exports = JsSandbox;