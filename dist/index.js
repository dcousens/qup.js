"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function qup(f, jobs = 1) {
    function signal() {
        let resolve = () => { };
        let resolved = false;
        const promise = new Promise((resolve_) => {
            resolve = () => {
                resolve_();
                resolved = true;
            };
        });
        return { promise, resolve, resolved: () => resolved };
    }
    const q = [];
    let drain_ = signal();
    let running = 0;
    async function run() {
        if (running >= jobs)
            return;
        const next = q.shift();
        if (!next)
            return;
        const { context, resolve, reject } = next;
        running += 1;
        let result;
        try {
            result = await f(context);
        }
        catch (e) {
            running -= 1;
            return reject(e);
        }
        running -= 1;
        resolve(result);
        run();
        // ready to drain?
        if (running || q.length)
            return;
        drain_.resolve();
    }
    function push(context) {
        if (drain_.resolved())
            drain_ = signal();
        return new Promise((resolve, reject) => {
            q.push({ context, resolve, reject });
            if (running < jobs)
                return run();
        });
    }
    function drain() {
        return drain_.promise;
    }
    // drained to begin with
    drain_.resolve();
    return {
        push,
        drain
    };
}
exports.default = qup;
