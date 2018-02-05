const Instance = require('./instance');
const settings = require('./../../settings.json');

class SandboxManager {
    constructor() {
        this.TOTAL_INSTANCES = settings['js-sandbox']['instances'];
        this.MAX_TASKS = Math.round(3 * this.TOTAL_INSTANCES / (settings['js-sandbox']['timeout'] / 1000));
        this._instances = [];
        this._tasks = [];
    }

    start() {
        for (let i = 0; i < this.TOTAL_INSTANCES; ++i) {
            this._instances.push(new Instance());
        }
    }

    /**
     * Send source code to available sandbox instance
     * @param {string} sourceCode 
     * @return {number} response id
     */
    send(sourceCode, external, args) {
        const instance = this._getFreeInstance();
        if (instance) {
            return instance.run(sourceCode, external, args)
                .then(x => {
                    setTimeout(() => this._onFree(instance));
                    return x;
                });
        } else if (this._tasks.length < this.MAX_TASKS) {
            return new Promise((resolve, reject) => {
                this._tasks.push({ sourceCode, external, args, resolve });
            });
        }
        return Promise.reject();
    }

    _onFree(instance) {
        if (!this._tasks.length) {
            return;
        }
        const task = this._tasks.shift();
        instance.run(task.sourceCode, task.external, task.args)
            .then(result => task.resolve(result));
    }

    _getFreeInstance() {
        return this._instances.find(i => i.isFree);
    }
}

module.exports = SandboxManager;