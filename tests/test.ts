import test, { suite } from "node:test"
import { test_default_verbosity, test_trace, test_off } from "./test_logger.js"

suite("Logger", () => {
    test("default verbosity", test_default_verbosity)
    test("trace verbosity", test_trace)
    test("off verbosity", test_off)
})
