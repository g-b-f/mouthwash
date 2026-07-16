#!/usr/bin/env node

import { checkDir } from "../src/index.js"
import argv from "minimist"
import { Logger } from "../src/utils.js"
import { default_read_options, default_report_options, type ReadOptions, type ReportOptions} from "../src/objects.js"

const args = argv(process.argv.slice(2))

const quiet = args.q ?? 0
const verbose = args.v ?? 1
let verbosity = verbose - quiet
if (verbosity > Logger.MAX_VERBOSITY){
    verbosity = Logger.MAX_VERBOSITY
}
else if (verbosity < Logger.MIN_VERBOSITY){
    verbosity = Logger.MIN_VERBOSITY
}

const logger = new Logger(verbosity)
logger.trace(args)

const report_options: ReportOptions = {
    min_intensity: args?.intensity ?? default_report_options.min_intensity,
    display_profanity: args?.display ?? default_report_options.display_profanity,
    categories: args?.categories,
    verbosity: verbosity
}

const read_options: ReadOptions = {
    ignore_leading_dot: !(args?.dotfiles || args?.dotfiles) || default_read_options.ignore_leading_dot,
    ignore_files: args.ignoreFiles?.split(",") ?? default_read_options.ignore_files,
    ignore_dirs: args.ignoreDirs?.split(",") ?? default_read_options.ignore_dirs,
    concurrent_threads: args?.threads ?? default_read_options.concurrent_threads,
    check_binary_files: args?.binary ?? default_read_options.check_binary_files
}

const dirs = args._.length > 0 ? args._ : ["."]

for (const dir of dirs) {
    logger.debug(`checking ${dir}`)
    checkDir(String(dir), read_options, report_options)
}

 