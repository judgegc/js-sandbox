const { VM, VMScript } = require('vm2');

const Stat = require('simple-statistics');
const request = require('request');

const EXECUTION_TIMEOUT = 1000;
let externalData = {};

process.on('message', data => {
    if (data.type === 'external_data') {
        externalData = data.data;
    } else if (data.type === 'source_code') {
        let startTime = 0;
        const response = [];
        let result;
        let pendingCbs = 0;

        function hasResult() {
            return typeof result === 'number' ? true : !!result;
        }

        function sendAndExit() {
            process.send(response.join('\n'));
            process.exit();
        }

        const pRequest = new Proxy(request, {
            apply: (target, thisValue, args) => {
                ++pendingCbs;
                const newArgs = args.map(a => typeof a === 'function' ? function () {
                    --pendingCbs;
                    if (!pendingCbs) {
                        setTimeout(sendAndExit);
                    }
                    return a.apply(thisValue, arguments);
                } : a);
                return target.apply(thisValue, newArgs);
            },
            /* get: (target, name) => {
                return target[name];
            } */
        });

        try {
            const vm = new VM({
                timeout: EXECUTION_TIMEOUT,
                sandbox: {
                    request: pRequest,
                    console: { log: (m) => response.push(typeof m === 'object' ? JSON.stringify(m) : m) }
                }
            });

            vm.freeze(Stat, 'Stat');
            vm.freeze(externalData, 'external');
            vm.freeze(externalData.args, 'arguments');
            //vm.freeze(request, 'request');
            startTime = Date.now();
            result = vm.run(data.data);
        }
        catch (e) {
            if (e) {
                response.push(e.name + ': ' + e.message);
            }
        }

        if (!pendingCbs) {
            if (hasResult() && !response.length) {
                response.push(typeof result === 'object' ? JSON.stringify(result) : result);
            }
            process.send(response.join('\n'));
            process.exit();
        }

        setTimeout(() => {
            process.send(response.join('\n'));
            process.exit();
        }, EXECUTION_TIMEOUT - Date.now() + startTime);
    }
});

process.on('uncaughtException', (err) => {
    process.send('Async exception: Something wrong happens');
});