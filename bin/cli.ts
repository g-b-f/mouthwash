#!/usr/bin/env node

import { checkDir } from "../src/index.js"
import yargs from 'yargs';
import { Logger } from "../src/utils.js"
import {
    default_read_options,
    default_report_options,
    type ReadOptions,
    type ReportOptions
} from "../src/objects.js"
import { Intensity, type Category } from "better-profane-words";

const args = yargs(process.argv.slice(2)).options({
    verbose: {type: "count", default: Logger.DEFAULT_VERBOSITY, alias: "v", describe: "increase verbosity"},
    quiet: {type: "count", default: 0, alias: "q", describe: "reduce verbosity"},
    intensity: {type: "number", default: 2, alias: "i", describe: "intensity of words"},
    categories: {type: "array", alias: "c", describe: "categories of words"},
    binary: {type: "boolean", alias: "b", describe: "whether to check binary files"},
    threads: {type: "number", alias: "t", describe: "maximum number of concurrent threads"},
    ignore_files: {type: "array", alias: "f", describe: "files to ignore"},
    dotfiles: {type: "boolean", alias: "d", describe: "whether to check dotfiles"},
    ignore_dirs: {type: "array", alias: "D", describe: "directories to ignore"},
    display_profanity: {type: "boolean", alias: "p", describe: "whether to display profane words"},
    _: {type: "array", describe: "directories to check"}
}).parseSync();

let intensity = args.intensity
if (intensity > 5){
    intensity = 5
}
else if (intensity < 1){
    intensity = 1
}
intensity = intensity as Intensity

let verbosity = args.verbose - args.quiet
if (verbosity > Logger.MAX_VERBOSITY){
    verbosity = Logger.MAX_VERBOSITY
}
else if (verbosity < Logger.MIN_VERBOSITY){
    verbosity = Logger.MIN_VERBOSITY
}

const logger = new Logger(verbosity)
logger.trace(args)

const categories = Array.isArray(args.categories) ? args.categories.map(String) as Category[] : undefined
const ignore_files = args?.ignore_files ? args.ignore_files.map(String) : undefined
const ignore_dirs = args.ignore_dirs ? args.ignore_dirs.map(String) : undefined

const report_options: ReportOptions = {
    min_intensity: typeof intensity === "number" ? (intensity as Intensity) : default_report_options.min_intensity,
    display_profanity: args.display_profanity ?? default_report_options.display_profanity,
    categories: categories ?? default_report_options.categories,
    verbosity: verbosity
}

const read_options: ReadOptions = {
    ignore_leading_dot: typeof args.dotfiles === "boolean" ? !args.dotfiles : default_read_options.ignore_leading_dot,
    ignore_files: ignore_files ?? default_read_options.ignore_files,
    ignore_dirs: ignore_dirs ?? default_read_options.ignore_dirs,
    concurrent_threads: args.threads ?? default_read_options.concurrent_threads,
    check_binary_files: args.binary ?? default_read_options.check_binary_files
}

logger.trace(report_options, "\n", read_options)

const dirs = args._.length > 0 ? args._ : ["."]

for (const dir of dirs) {
    logger.debug(`checking ${dir}`)
    checkDir(String(dir), read_options, report_options)
}

 