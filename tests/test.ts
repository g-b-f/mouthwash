import test, { suite } from "node:test"
import { test_default_verbosity, test_trace, test_off } from "./test_logger.js"
import { default_args } from "./test_cli.js"
import { test_checkDir, test_checkFile, test_parse_gitignore } from "./test_index.js"

suite("Logger", () => {
    test("default verbosity", test_default_verbosity)
    test("trace verbosity", test_trace)
    test("off verbosity", test_off)
})
suite("cli", () => {
    test("get and parse default args", default_args)
})
suite("index", () => {
    suite("checkFile", () => {
        test("report profane files", test_checkFile)
    })
    suite("checkDir", () => {
        test("report dirs", test_checkDir)
        test("ignore files in .gitignore", test_parse_gitignore)
    })
})