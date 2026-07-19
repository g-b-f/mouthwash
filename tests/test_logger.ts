import assert from "node:assert/strict"
import { Logger } from "../src/utils.js"
import { capture_logs } from "./lib.js"

export function test_default_verbosity (){
    const defaultLogger = new Logger(undefined, "default")
    assert.strictEqual(defaultLogger.verbosity, Logger.DEFAULT_VERBOSITY)
    assert.strictEqual(defaultLogger.prefix, "default")

    const callsAtWarn = capture_logs(() => {
        const logger = new Logger(Logger.log_levels.warn, "warn-test")
        logger.trace("trace should stay silent")
        logger.debug("debug should stay silent")
        logger.info("info should stay silent")
        logger.warn("warn should be visible")
        logger.error("error should be visible")
    })

    assert.deepStrictEqual(callsAtWarn.map((entry) => entry.method), ["warn", "error"])
    assert.deepStrictEqual(callsAtWarn[0].args, ["warn-test", "warn should be visible"])
    assert.deepStrictEqual(callsAtWarn[1].args, ["warn-test", "error should be visible"])
}

export function test_trace (){
    const callsAtTrace = capture_logs(() => {
        const logger = new Logger(Logger.log_levels.trace, "trace-test")
        logger.trace("trace should be visible")
        logger.debug("debug should be visible")
        logger.info("info should be visible")
        logger.warn("warn should be visible")
        logger.error("error should be visible")
    })

    assert.deepStrictEqual(callsAtTrace.map((entry) => entry.method), ["debug", "debug", "info", "warn", "error"])
    assert.deepStrictEqual(callsAtTrace[0].args, ["trace-test", "trace should be visible"])
    assert.deepStrictEqual(callsAtTrace[1].args, ["trace-test", "debug should be visible"])
    assert.deepStrictEqual(callsAtTrace[2].args, ["trace-test", "info should be visible"])
    assert.deepStrictEqual(callsAtTrace[3].args, ["trace-test", "warn should be visible"])
    assert.deepStrictEqual(callsAtTrace[4].args, ["trace-test", "error should be visible"])
}

export function test_off(){
    const callsAtOff = capture_logs(() => {
        const logger = new Logger(Logger.log_levels.off, "off-test");
        logger.trace("trace should be ignored");
        logger.debug("debug should be ignored");
        logger.info("info should be ignored");
        logger.warn("warn should be ignored");
        logger.error("error should be ignored");
    });

    assert.strictEqual(callsAtOff.length, 0);
}