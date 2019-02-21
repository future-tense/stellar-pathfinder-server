
const levels = {
    'none':     0,
    'fatal':    1,
    'error':    2,
    'warn':     3,
    'info':     4,
    'debug':    5,
    'trace':    6,
    'all':      6,
};

const logLevel = (() => {
    const l = process.env.LOG_LEVEL;
    if (l) {
        const ll = levels[l.toLowerCase()];
        if (ll) {
            return ll;
        }
    }

    return levels.info;
})();

// -----------------------------------------------------------------------------

const log = (
    level: number,
    ...args: any[]
): void => {
    if (level > logLevel) {
        return;
    }

    const now = new Date().toISOString();
    console.log(now, ...args);
};

// -----------------------------------------------------------------------------

export function fatal(...args: any[]) {
    log(levels.fatal, ...args);
}

export function error(...args: any[]) {
    log(levels.error, ...args);
}

export function warn(...args: any[]) {
    log(levels.warn, ...args);
}

export function info(...args: any[]) {
    log(levels.info, ...args);
}

export function debug(...args: any[]) {
    log(levels.debug, ...args);
}

export function trace(...args: any[]) {
    log(levels.trace, ...args);
}
