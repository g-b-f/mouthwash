export class Logger {
    public verbosity: number
    public prefix: any

    static readonly log_levels: Record<string, number> = {
        trace: 0,
        debug: 1,
        info: 2,
        error: 3,
    }
    static readonly MAX_VERBOSITY = Logger.log_levels.error
    static readonly MIN_VERBOSITY = Logger.log_levels.trace
    static readonly DEFAULT_VERBOSITY = Logger.log_levels.info

    public constructor(verbosity: number | undefined, prefix=""){
        this.verbosity = verbosity ?? Logger.DEFAULT_VERBOSITY
        this.prefix = prefix
    }

    public trace(text: any){
        if (this.verbosity >= Logger.log_levels.trace){
            console.warn(this.prefix, text)
        }
    }
    public debug(text: any){
        if (this.verbosity >= Logger.log_levels.debug){
            console.debug(this.prefix, text)
        }
    }
    public log(text: any){
        if (this.verbosity >= Logger.log_levels.info){
            console.log(this.prefix, text)
        }
    }
    public error(text: any){
        if (this.verbosity >= Logger.log_levels.error){
            console.error(this.prefix, text)
        }
    }

}
    