const childProcess = require('child_process');

const settings = require('./../../settings.json');

class Instance {
    constructor() {
        this.MEMORY_LIMIT = settings['js-sandbox']['memory-limit'];
        this._isFree = true;
        this._startInstance();
        this._setupListeners();
    }

    run(sourceCode, external, args) {
        if (!this._isFree) {
            throw Error('Worker is busy');
        }

        this._isFree = false;
        this._worker.send({ sourceCode, external, args });
        return new Promise((resolve, reject) => {
            this._resolve = resolve;
        });
    }

    get isFree() {
        return this._isFree;
    }

    _onMessage(data) {
        this._isFree = true;
        this._resolve(data);
    }

    _onClose(exitCode) {
        this._isFree = true;
        if (exitCode === 3) {
            this._resolve('Error: Sandbox memory limit reached');
        }
        this._startInstance();
        this._setupListeners();
    }

    _setupListeners(instance) {
        this._worker.on('message', this._onMessage.bind(this));
        this._worker.on('close', this._onClose.bind(this));
    }

    _startInstance() {
        this._worker = childProcess.fork('src/js-sandbox/worker.js', { execArgv: ['--max-old-space-size=' + this.MEMORY_LIMIT], detached: true });
    }
}

module.exports = Instance;