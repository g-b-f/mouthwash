import { containsProfanity } from "better-profane-words";
import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pLimit from 'p-limit';

const CONCURRENT_PROMISES = 1

type ProfanityResult = {
    isProfane: boolean
    file: string
}


export async function checkFile(filePromise: Promise<string>, filePath:string): Promise<ProfanityResult> {
    console.log(filePath)
    const fileConts = await filePromise;
    const profane = containsProfanity(fileConts)
    return {isProfane: profane, file: filePath}
}

export default function checkDir(dir = ".") {
    const dirents = readdirSync(dir, { withFileTypes: true });
    const files = dirents
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name)

    const tasks = files.map(file => {
        const filePath = join(dir, file);
        const fileContsPromise = readFile(filePath, "utf-8")
        return () => checkFile(fileContsPromise, filePath)
    })

    const limit = pLimit(CONCURRENT_PROMISES);
    const limitedTasks = tasks.map(task => limit(task));
    Promise.all(limitedTasks).then(() => {
        console.log("All files processed.")
    })
}

