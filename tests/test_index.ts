import assert from "node:assert/strict"
import { temp_dir, temp_file } from "./lib.js"
import { writeFileSync } from "node:fs";
import { checkFile, checkDir } from "../src/index.js";
import { readFile } from "node:fs/promises";
import { ProfanityFinding } from "../src/objects.js";

const file_conts = `not a problem
this line contains fuck
not a problem either
this line contains shit
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
        writeFileSync(file, file_conts)
        const file_promise = readFile(file, "utf-8")
        checkFile(file_promise, file).then((result) => {
            assert.strictEqual(result.file, file)
            assert.strictEqual(result.isProfane, true)
            assert.deepStrictEqual(result?.lines?.[0], expected1)
            assert.deepStrictEqual(result?.lines?.[1], expected2)
        })
    })
}