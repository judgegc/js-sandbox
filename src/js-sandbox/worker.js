const { VM, VMScript } = require('vm2');
const Stat = require('simple-statistics');
const request = require('request');

const settings = require('./../../settings.json');

const EXECUTION_TIMEOUT = settings['js-sandbox']['timeout'];
const STATE_CAPACITY = settings['js-sandbox']['state-capacity'];

process.on('message', data => {
    let startTime;
    let result;
    const response = [];
    const commandState = stateToObj(data.state);
    let pendingCbs = [];

    function stateToObj(state) {
        let obj = {};
        if (typeof state === 'string') {
            try {
                obj = JSON.parse(state);
            } catch (e) {
            }
        }
        return obj;
    }

    function hasResult() {
        return typeof result === 'number' ? true : !!result;
    }

    function sendResponse() {
        const stateStr = JSON.stringify(commandState);
        if (stateStr.length > STATE_CAPACITY) {
            process.send({ response: `Error: State size limit has been reached. (Capacity: ${STATE_CAPACITY}, actual: ${stateStr.length})` });
        } else {
            process.send({ state: stateStr, response: response.join('\n') });
        }

    }

    function injectCbCounter(target, thisVal, args) {
        return args.map(a => typeof a === 'function' ? function () {
            pendingCbs.splice(pendingCbs.indexOf(target), 1);
            if (!pendingCbs.length) {
                setTimeout(sendResponse);
            }
            return a.apply(thisVal, arguments);
        } : a);
    }

    const pRequest = new Proxy(request, {
        apply: (target, thisValue, args) => {
            pendingCbs.push(target);
            return target.apply(thisValue, injectCbCounter(target, thisValue, args));
        },
        get: (target, name) => {
            const methodProxy = new Proxy(target[name], {
                apply: (mTarget, thisValue, args) => {
                    if (['get', 'head', 'post', 'put', 'patch', 'del', 'delete'].includes(name)) {
                        pendingCbs.push(target);
                    }
                    return mTarget.apply(thisValue, injectCbCounter(target, thisValue, args));
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
        startTime = Date.now();
        result = vm.run(data.sourceCode);
    }
    catch (e) {
        if (e) {
            response.push(e.name + ': ' + e.message);
        }
    }

    if (!pendingCbs.length) {
        if (hasResult() && !response.length) {
            response.push(typeof result === 'object' ? JSON.stringify(result) : result);
        }
        sendResponse();
        return;
    }

    setTimeout(() => {
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