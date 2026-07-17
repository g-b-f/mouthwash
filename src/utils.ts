export class Logger {
    public verbosity: number
    public prefix: unknown

    static readonly log_levels = {
        trace: 5,
        debug: 4,
        info: 3,
        warn: 2,
        error: 1,
        off: 0
    }
    static readonly MAX_VERBOSITY = Logger.log_levels.trace
    static readonly MIN_VERBOSITY = Logger.log_levels.off
    static readonly DEFAULT_VERBOSITY = Logger.log_levels.info

    public constructor(verbosity: number | undefined, prefix: unknown = "") {
        this.verbosity = verbosity ?? Logger.DEFAULT_VERBOSITY
        this.prefix = prefix
    }

    public trace(...args: unknown[]) {
        if (this.verbosity >= Logger.log_levels.trace) {
            console.debug(this.prefix, ...args)
        }
    }
    public debug(...args: unknown[]) {
        if (this.verbosity >= Logger.log_levels.debug) {
            console.debug(this.prefix, ...args)
        }
    }
    public info(...args: unknown[]) {
        if (this.verbosity >= Logger.log_levels.info) {
            console.info(this.prefix, ...args)
        }
    }
    public warn(...args: unknown[]) {
        if (this.verbosity >= Logger.log_levels.warn) {
            console.warn(this.prefix, ...args)
        }
    }
    public error(...args: unknown[]) {
        if (this.verbosity >= Logger.log_levels.error) {
            console.error(this.prefix, ...args)
        }
    }
}