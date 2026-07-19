import { type CombinedOptions, default_read_options, default_report_options } from "../src/objects.js";
import { get_args, parse_args } from "../bin/cli.js";
import assert from "node:assert/strict"

const expected: CombinedOptions = {
    read_options: default_read_options,
    report_options: {...default_report_options, verbosity: 3, categories: undefined }
}

export function default_args(){
    const args = get_args([""])
    const options = parse_args(args)
    assert.deepStrictEqual(options.read_options, expected.read_options)
    assert.deepStrictEqual(options.report_options, expected.report_options)
}