import { containsProfanity, type FilterOptions } from "better-profane-words";
import { readdirSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path"
import pLimit from 'p-limit';
import { isBinaryFileSync } from 'isbinaryfile';
import {
    default_read_options, 
    default_report_options,
    type ProfanityFinding,
    type ProfanityResult,
    type ReadOptions,
    type ReportOptions
} from "./objects.js";
import { Logger } from "./utils.js";

/**
 * 
 * @param filePromise Promise that resolves to the contents of the file
 * @param filePath the path to the file
 * @param read_options options for reading and searching
 * @param report_options options for reporting to the user
 * @returns a Promise<ProfanityResult> object containing whether the file contains profanity,
 *  the file path, and optionally the lines containing profanity
 */
export async function checkFile(
    filePromise: Promise<string>,
    filePath:string,
    read_options?: ReadOptions,
    report_options?:ReportOptions
    ): Promise<ProfanityResult> {
    read_options ??= default_read_options
    report_options ??= default_report_options
    const logger = new Logger(report_options.verbosity)
    logger.trace("checkFile with args\n", read_options, "\n", report_options)

    if (!read_options.check_binary_files && isBinaryFileSync(filePath)) {
        logger.debug(`${filePath} is binary, skipping`)
        return {isProfane: false, file: filePath}
    }

    logger.debug(`checking ${filePath}`)
    const fileConts = await filePromise

    const profanity_options: FilterOptions  = {
        minIntensity: report_options.min_intensity,
        categories: report_options.categories
    }
    const profane = containsProfanity(fileConts, profanity_options)
    if (report_options.display_profanity){
        let lineNum = 0
        let profaneLines: ProfanityFinding[] = []
        for (const line of fileConts.split(/\r?\n/)) {
            lineNum++
            if (containsProfanity(line, profanity_options)){
                profaneLines.push({line, lineNum})
            }
        }
        return {isProfane: profane, file: filePath, lines: profaneLines}
    }
    return {isProfane: profane, file: filePath}
}

function walk(directory: string, options: ReadOptions): string[] {
    const results: string[] = [];
    const dirents = readdirSync(directory, { withFileTypes: true });
    for (const dirent of dirents) {
        if (options.ignore_leading_dot && dirent.name.startsWith('.')) continue;
        
        const resolvedPath = path.resolve(directory, dirent.name);
        if (dirent.isDirectory()) {
            if (options.ignore_dirs.includes(dirent.name)) continue;
            results.push(...walk(resolvedPath, options));
        }
        else if (dirent.isFile()) {
            if (options.ignore_files.includes(dirent.name)) continue;
            results.push(resolvedPath);
        }
    }
    return results;
}

// TODO: parse globbing etc properly
function parse_gitignore(
    gitignorePath:string,
    read_options: ReadOptions,
    report_options: ReportOptions
    ): ReadOptions{
    const logger = new Logger(report_options.verbosity)
    logger.trace("parse_gitignore with args\n", read_options, "\n", report_options)
    try {
        const gitignore = readFileSync(gitignorePath, "utf8")
        const entries = gitignore.split(/\r?\n/)
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('#'))
        
        const filesSet = new Set(read_options.ignore_files)
        const dirsSet = new Set(read_options.ignore_dirs)
        for (const e of entries) {
            if (e.endsWith('/')) {
                dirsSet.add(e.replace(/\/+$/, ''))
            } else {
                if (e.includes('/')) {
                    filesSet.add(path.basename(e))
                } else {
                    filesSet.add(e)
                }
            }
        }
        read_options.ignore_files = Array.from(filesSet)
        read_options.ignore_dirs = Array.from(dirsSet)

    } catch (error) {
        logger.debug(".gitignore not found, or unreadable")
    }
    return read_options

}
/**
 * Checks a directory for files containing profanity
 * @param dir The directory to search 
 * @param read_options options for reading and searching
 * @param report_options options for reporting to the user
 * @returns the number of files containing profanity
 */
export function checkDir(
    dir = ".",
    read_options?: ReadOptions,
    report_options?: ReportOptions
    ): number {
    read_options ??= default_read_options
    report_options ??= default_report_options

    const logger = new Logger(report_options.verbosity)
    logger.trace("checkDir with args\n", read_options, "\n", report_options)
    logger.info(`checking dir: ${dir}`)

    const gitignorePath = path.join(dir, ".gitignore")
    read_options = parse_gitignore(gitignorePath, read_options, report_options)

    const files = walk(dir, read_options);
    const tasks = files.map(filePath => {
        const fileContsPromise = readFile(filePath, "utf-8")
        return () => checkFile(fileContsPromise, filePath)
    })

    const limit = pLimit(read_options.concurrent_threads);
    const limitedTasks = tasks.map(task => limit(task));

    let files_num = 0
    Promise.all(limitedTasks).then(results => {
        const profaneFiles = results.filter(result => result.isProfane)
        if (profaneFiles.length > 0) {
            logger.info("Profanity found in the following files:")
            profaneFiles.forEach(result => {
                logger.info(result.file)
                if (report_options.display_profanity) {
                    result.lines?.forEach(lineInfo => {
                        logger.info(`L${lineInfo.lineNum}: ${lineInfo.line.trim()}`)
                    })
                }
            })
            files_num = profaneFiles.length
        }
    })
    return files_num
}