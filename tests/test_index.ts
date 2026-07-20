import assert from "node:assert/strict"
import { temp_dir, temp_file } from "./lib.js"
import { writeFileSync } from "node:fs";
import { checkFile, checkDir } from "../src/index.js";
import { readFile } from "node:fs/promises";
import { type ProfanityFinding } from "../src/objects.js";
import { join } from "node:path";

const file_conts_bad = `not a problem
this line contains fuck
not a problem either
this line contains shit
this line should be okay
`
const file_conts_good = `not a problem
not a problem either
this line should be okay
`

const expected1: ProfanityFinding = {
    line: "this line contains fuck",
    lineNum: 2
}
const expected2: ProfanityFinding = {
    line: "this line contains shit",
    lineNum: 4
}

export function test_checkFile(){
    temp_file((file) => {
        writeFileSync(file, file_conts_bad)
        const file_promise = readFile(file, "utf-8")
        checkFile(file_promise, file).then((result) => {
            assert.strictEqual(result.file, file)
            assert.strictEqual(result.isProfane, true)
            assert.deepStrictEqual(result?.lines, [expected1, expected2])
        })
    })
}

export function test_checkDir(){
    temp_dir((dir) => {
        writeFileSync(join(dir, "bad_file_1.txt"), file_conts_bad)
        writeFileSync(join(dir, "good_file_1.txt"), file_conts_good)
        writeFileSync(join(dir, "bad_file_2.md"), file_conts_bad)
        writeFileSync(join(dir, "good_file_2.md"), file_conts_good)
        checkDir(dir).then(result =>{
            assert.strictEqual(result, 2)
        })
    })
}
