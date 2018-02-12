const bytes = require('bytes');
const settings = require('./../../settings.json');

class MemoryUsageCommand {
    constructor(args) {
        this.args = args;
    }

    execute(client, msg) {
        const memUsage = process.memoryUsage();
        const sandboxMemoryLimit = Number.parseInt(settings['js-sandbox']['memory-limit']);
        return new Promise((resolve, reject) => {
            resolve(Object.keys(memUsage).map(p => p + ': ' + bytes(memUsage[p]))
                .concat('sandboxLimit: ' + bytes(sandboxMemoryLimit * 1024 * 1024))
                .concat(`pool size: ${settings['js-sandbox']['instances']}`)
                .join('\n'));
        });
    }
}

module.exports = MemoryUsageCommand;