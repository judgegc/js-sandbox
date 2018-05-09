const { VM, VMScript } = require('vm2');
const Stat = require('simple-statistics');
const request = require('request');
const prettyMs = require('pretty-ms');
const moment = require('moment');
const crypto = require('crypto');
const url = require('url');

const settings = require('./../../settings.json');

const EXECUTION_TIMEOUT = settings['js-sandbox']['timeout'];
const STATE_CAPACITY = settings['js-sandbox']['state-capacity'];

process.on('message', data => {
    let startTime;
    let result;
    const response = [];
    const commandState = JSON.parse(data.state);
    const pendingCbs = [];
    let timeoutTimer = -1;

    function sendResponse() {
        clearTimeout(timeoutTimer);
        const stateStr = JSON.stringify(commandState);

        const r = stateStr.length > STATE_CAPACITY ?
            { response: `Error: State size limit has been reached. (Capacity: ${STATE_CAPACITY}, actual: ${stateStr.length})` } :
            { state: stateStr, response: response.join('\n') };

        process.send(r);
    }

    function injectCbCounter(target, thisVal, args) {
        return args.map(a => typeof a === 'function' ? function () {
            pendingCbs.splice(pendingCbs.indexOf(target), 1);
            if (!pendingCbs.length) {
                setTimeout(sendResponse);
            }
            try {
                return a.apply(thisVal, arguments);
            }
            catch (e) {
                response.push(e.toString());
            }
            return undefined;
        } : a);
    }

    const pRequest = new Proxy(request, {
        apply: (target, thisValue, args) => {
            const rcb = target.apply(thisValue, injectCbCounter(target, thisValue, args));
            pendingCbs.push(rcb);
            return rcb;
        },
        get: (target, name) => {
            const methodProxy = new Proxy(target[name], {
                apply: (mTarget, thisValue, args) => {
                    const rcb = mTarget.apply(thisValue, injectCbCounter(target, thisValue, args));
                    if (['get', 'head', 'post', 'put', 'patch', 'del', 'delete'].includes(name)) {
                        pendingCbs.push(rcb);
                    }
                    return rcb;
                }
            });
            return methodProxy;
        }
    });

    try {
        const vm = new VM({
            timeout: EXECUTION_TIMEOUT,
            sandbox: {
                state: commandState,
                request: pRequest,
                console: { log: (m) => response.push(typeof m === 'object' ? JSON.stringify(m) : m) }
            }
        });

        vm.freeze(Stat, 'Stat');
        vm.freeze(data.external, 'external');
        vm.freeze(data.args, 'arguments');
        vm.freeze(prettyMs, 'Pms');
        vm.freeze(moment, 'moment');
        vm.freeze(crypto, 'crypto');
        vm.freeze(url, 'url');
        startTime = Date.now();
        result = vm.run(data.sourceCode);
    }
    catch (e) {
        if (e) {
            response.push(e.name + ': ' + e.message);
        }
    }

    if (!pendingCbs.length) {
        if (!(result === undefined || response.length)) {
            response.push(typeof result === 'object' ? JSON.stringify(result) : result);
        }
        sendResponse();
        return;
    }

    timeoutTimer = setTimeout(() => {
        if (pendingCbs.length > 0) {
            process.send({ response: 'Error: Script execution timed out.' });
            pendingCbs.forEach(cb => cb.abort());
            return;
        }

        sendResponse();
    }, EXECUTION_TIMEOUT - Date.now() + startTime);
});

process.on('uncaughtException', (err) => {
    process.send({ response: 'Async exception: Something wrong happens' });
});