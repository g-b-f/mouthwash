import assert from "node:assert/strict"
import { Logger } from "../src/utils.js"
import { capture_logs } from "./lib.js"

export function test_default_verbosity (){
    const defaultLogger = new Logger(undefined, "default")
    assert.equal(defaultLogger.verbosity, Logger.DEFAULT_VERBOSITY)
    assert.equal(defaultLogger.prefix, "default")

    const callsAtWarn = capture_logs(() => {
        const logger = new Logger(Logger.log_levels.warn, "warn-test")
        logger.trace("trace should stay silent")
        logger.debug("debug should stay silent")
        logger.info("info should stay silent")
        logger.warn("warn should be visible")
        logger.error("error should be visible")
    })

    assert.deepEqual(callsAtWarn.map((entry) => entry.method), ["warn", "error"])
    assert.deepEqual(callsAtWarn[0].args, ["warn-test", "warn should be visible"])
    assert.deepEqual(callsAtWarn[1].args, ["warn-test", "error should be visible"])
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

    assert.deepEqual(callsAtTrace.map((entry) => entry.method), ["debug", "debug", "info", "warn", "error"])
    assert.deepEqual(callsAtTrace[0].args, ["trace-test", "trace should be visible"])
    assert.deepEqual(callsAtTrace[1].args, ["trace-test", "debug should be visible"])
    assert.deepEqual(callsAtTrace[2].args, ["trace-test", "info should be visible"])
    assert.deepEqual(callsAtTrace[3].args, ["trace-test", "warn should be visible"])
    assert.deepEqual(callsAtTrace[4].args, ["trace-test", "error should be visible"])
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

    assert.equal(callsAtOff.length, 0);
}