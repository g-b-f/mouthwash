import test, { suite } from "node:test"
import { test_default_verbosity, test_trace, test_off } from "./test_logger.js"
import { default_args } from "./test_cli.js"
import { test_checkFile } from "./test_index.js"

suite("Logger", () => {
    test("default verbosity", test_default_verbosity)
    test("trace verbosity", test_trace)
    test("off verbosity", test_off)
})
suite("cli", () => {
    test("get and parse default args", default_args)
})
suite("index", () => {
    test("report profane files", test_checkFile)
})