#!/usr/bin/env node

import { checkDir } from "../src/index.js"
import yargs from 'yargs'
import { Logger } from "../src/utils.js"
import {
    default_read_options,
    default_report_options,
    type ReadOptions,
    type ReportOptions,
    type CombinedOptions
} from "../src/objects.js"
import { Intensity, type Category } from "better-profane-words"

type ArgsArray = (string | number)[]
type ArgsType = {
    verbose: number
    quiet: number
    intensity: number
    categories: ArgsArray | undefined
    binary: boolean | undefined
    threads: number | undefined
    ignore_files: ArgsArray | undefined
    dotfiles: boolean | undefined
    ignore_dirs: ArgsArray | undefined
    display_profanity: boolean | undefined
    _: ArgsArray
}

export function get_args(cli_args?: string[]): ArgsType{
    cli_args ??= process.argv.slice(2)
    const args = yargs(cli_args).options({
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
    }).parseSync()
    return args
}

export function parse_args(args: ArgsType): CombinedOptions{
    let intensity = args.intensity as Intensity
    if (intensity > 5){
        intensity = 5
    }
    else if (intensity < 1){
        intensity = 1
    }

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

    return {read_options, report_options}    
}

export function check_multiple_dirs(dirs:string[], options: CombinedOptions){
    logger.trace("check_multiple_dirs with dirs:", dirs)

    const tasks = dirs.map(dir => {
        return checkDir(dir, options.read_options, options.report_options)
    })

    Promise.all(tasks).then(results => {
        const files_num = results.reduce((acc, val) => acc + val, 0)
    
        if (files_num > 0){
            logger.info(`Profanity found in ${files_num} files`)
            process.exit(1)
        }
        else {
            logger.info("No profanity found")
            process.exit(0)
        }
    })
}

const args = get_args()
const options = parse_args(args)
const dirs = args._.length > 0 ? args._.map(String) : ["."]

const logger = new Logger(options.report_options.verbosity)
logger.trace(options.report_options, "\n", options.read_options)

check_multiple_dirs(dirs, options)