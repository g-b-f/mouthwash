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
} from "./objects";


export async function checkFile(
    filePromise: Promise<string>,
    filePath:string,
    read_options?: ReadOptions,
    report_options?:ReportOptions
    ): Promise<ProfanityResult> {
    read_options ??= default_read_options
    report_options ??= default_report_options

    if (!read_options.check_binary_files && isBinaryFileSync(filePath)) {
        return {isProfane: false, file: filePath}
    }

    // console.debug(`checking ${filePath}`)
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
function parse_gitignore(gitignorePath:string, options: ReadOptions): ReadOptions{
    try {
        const gitignore = readFileSync(gitignorePath, "utf8")
        const entries = gitignore.split(/\r?\n/)
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('#'))
        
        const filesSet = new Set(options.ignore_files)
        const dirsSet = new Set(options.ignore_dirs)
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
        options.ignore_files = Array.from(filesSet)
        options.ignore_dirs = Array.from(dirsSet)

    } catch (err) {
        // .gitignore not found, or unreadable
        // TODO: add logging for each case
    }
    return options

}
export function checkDir(
    dir = ".",
    read_options?: ReadOptions,
    report_options?:ReportOptions
    ){
    read_options ??= default_read_options
    report_options ??= default_report_options
    console.log(`checking dir: ${dir}`)

    const gitignorePath = path.join(dir, ".gitignore")
    read_options = parse_gitignore(gitignorePath, read_options)

    const files = walk(dir, read_options);
    const tasks = files.map(filePath => {
        const fileContsPromise = readFile(filePath, "utf-8")
        return () => checkFile(fileContsPromise, filePath)
    })

    const limit = pLimit(read_options.concurrent_threads);
    const limitedTasks = tasks.map(task => limit(task));

    Promise.all(limitedTasks).then(results => {
        const profaneFiles = results.filter(result => result.isProfane)
        if (profaneFiles.length > 0) {
            console.log("Profanity found in the following files:")
            profaneFiles.forEach(result => {
                console.log(result.file)
                if (report_options.display_profanity) {
                    result.lines?.forEach(lineInfo => {
                        console.log(`L${lineInfo.lineNum}: ${lineInfo.line.trim()}`)
                    })
                }
            })
        }
        else {
            console.log("No profanity found")
        }
    })
}