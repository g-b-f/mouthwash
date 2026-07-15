#!/usr/bin/env node

import { checkDir } from "../src/index.ts"
import argv from "minimist"

const args = argv(process.argv.slice(2))
console.log(args)

const dirs = args._.length > 0 ? args._ : ["."]

for (const dir of dirs) {
    console.log(`looking at ${dir}`)
    checkDir(String(dir))
}

 