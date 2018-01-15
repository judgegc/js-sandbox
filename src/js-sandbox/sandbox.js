const { VM, VMScript } = require('vm2');

const Stat = require('simple-statistics');

let externalData = {};

process.on('message', data => {
    if (data.type === 'external_data') {
        externalData = data.data;
    } else if (data.type === 'source_code') {
        const response = [];
        try {
            const vm = new VM({
                timeout: 300,
                sandbox: {
                    console: { log: (m) => response.push(typeof m === 'object' ? JSON.stringify(m) : m) }
                }
            });

            vm.freeze(Stat, 'Stat');
            vm.freeze(externalData, 'external');
            const result = vm.run(data.data);

            if (result && !response.length) {
                response.push(typeof result === 'object' ? JSON.stringify(result) : result);
            }
        }
        catch (e) {
            if (e) {
                response.push(e.name + ': ' + e.message);
            }
        }
        process.send(response.join('\n'));
        process.exit();
    }
});