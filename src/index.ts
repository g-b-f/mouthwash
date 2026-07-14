import { containsProfanity } from "better-profane-words";
import { Dirent, readdirSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path"
import pLimit from 'p-limit';

const CONCURRENT_PROMISES = 1

type ProfanityResult = {
    isProfane: boolean
    file: string
}

// const ignore_files = [".gitignore", "cli.ts", "index.ts"]
// const ignore_dirs = [".git"]

export async function checkFile(filePromise: Promise<string>, filePath:string): Promise<ProfanityResult> {
    console.debug(`checking ${filePath}`)
    const fileConts = await filePromise;
    const profane = containsProfanity(fileConts)
    return {isProfane: profane, file: filePath}
}

type WalkOptions = {
    ignore_leading_dot: boolean,
    ignore_files: string[],
    ignore_dirs: string[]
}

const default_walk_options: WalkOptions = {
    ignore_leading_dot: true,
    ignore_files: [".gitignore"],
    ignore_dirs: [".git"]
}

function walk(directory: string, options:WalkOptions): string[] {
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
export default function checkDir(dir = ".") {
    let walk_options = default_walk_options
    const files = walk(dir, walk_options);

    const tasks = files.map(filePath => {
        const fileContsPromise = readFile(filePath, "utf-8")
        return () => checkFile(fileContsPromise, filePath)
    })

    const limit = pLimit(CONCURRENT_PROMISES);
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