import { containsProfanity } from "better-profane-words";
import { Dirent, readdirSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path"
import pLimit from 'p-limit';

const CONCURRENT_FILEREADS = 30

type ProfanityResult = {
    isProfane: boolean
    file: string
}

type Options = {
    ignore_leading_dot: boolean,
    ignore_files: string[],
    ignore_dirs: string[],
    concurrent_file_reads: number
}

const default_options: Options = {
    ignore_leading_dot: true,
    ignore_files: [".gitignore"],
    ignore_dirs: [".git"],
    concurrent_file_reads: 10
}

export async function checkFile(filePromise: Promise<string>, filePath:string): Promise<ProfanityResult> {
    console.debug(`checking ${filePath}`)
    const fileConts = await filePromise;
    const profane = containsProfanity(fileConts)
    return {isProfane: profane, file: filePath}
}

function walk(directory: string, options:Options): string[] {
    const results: string[] = [];
    const dirents = readdirSync(directory, { withFileTypes: true });
    for (const dirent of dirents) {
        if (options.ignore_leading_dot && dirent.name.startsWith('.')) continue;
        
        const resolved = path.resolve(directory, dirent.name);
        if (dirent.isDirectory()) {
            if (options.ignore_dirs.includes(dirent.name)) continue;
            results.push(...walk(resolved, options));
        }
        else if (dirent.isFile()) {
            if (options.ignore_files.includes(dirent.name)) continue;
            results.push(resolved);
        }
    }
    return results;
}

// TODO: parse globbing etc properly
function parse_gitignore(gitignorePath:string, options: Options): Options{
    try {
        const gitignore = readFileSync(gitignorePath, 'utf8')
    
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
export function checkDir(dir = ".") {
    let walk_options = default_options
    const gitignorePath = path.join(dir, ".gitignore")
    walk_options = parse_gitignore(gitignorePath, walk_options)
    const files = walk(dir, walk_options);

    const tasks = files.map(filePath => {
        const fileContsPromise = readFile(filePath, "utf-8")
        return () => checkFile(fileContsPromise, filePath)
    })

    const limit = pLimit(CONCURRENT_FILEREADS);
    const limitedTasks = tasks.map(task => limit(task));

    Promise.all(limitedTasks).then(results => {
        const profaneFiles = results.filter(result => result.isProfane);
        if (profaneFiles.length > 0) {
            console.log("Profanity found in the following files:");
            profaneFiles.forEach(result => {
                console.log(result.file);
            });
        }
        else {
            console.log("No profanity found")
        }
    })
}