const childProcess = require('child_process');
const os = require('os');
const bytes = require('bytes');

const Util = require('./../util');
const settings = require('./../../settings.json');

class MemoryUsageCommand {
    constructor(args) {
        this.args = args;
    }

    async execute(client, msg) {
        const memUsage = process.memoryUsage();
        const totalThreads = await (async () => {
            return new Promise((resolve, reject) => {
                switch (os.platform()) {
                    case 'linux':
                        childProcess.exec('ps -eo nlwp | tail -n +2 | awk \'{ num_threads += $1 } END { print num_threads }\'', (error, stdout, stderr) => {
                            if (error) {
                                resolve('unknown');
                            }
                            resolve(stdout);
                        });
                        break;
                    default:
                        resolve('unknown');
                }
            });
        })();

        return new Promise((resolve, reject) => {
            resolve(Object.keys(memUsage).map(p => `${p}: ${bytes(memUsage[p])}`)
                .concat(`sandboxLimit: ${bytes(settings['js-sandbox']['memory-limit'] * 1024 * 1024)}`)
                .concat(`totalThreads: ${totalThreads}`)
                .concat(`pool size: ${settings['js-sandbox']['instances']}`)              
                .join('\n'));
        });
    }
}

module.exports = MemoryUsageCommand;