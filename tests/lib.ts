import { mkdtemp, rmSync } from "node:fs"
import { join, sep } from "node:path";
import { tmpdir } from "node:os";

type ConsoleMethod = "debug" | "info" | "warn" | "error"
type captured_log = { method: ConsoleMethod; args: unknown[] }

export function capture_logs(func: () => void): captured_log[] {
    const calls: captured_log[] = []

    console.debug = ((...args: unknown[]) => {
        calls.push({ method: "debug", args })
    }) as typeof console.debug
    console.info = ((...args: unknown[]) => {
        calls.push({ method: "info", args })
    }) as typeof console.info
    console.warn = ((...args: unknown[]) => {
        calls.push({ method: "warn", args })
    }) as typeof console.warn
    console.error = ((...args: unknown[]) => {
        calls.push({ method: "error", args })
    }) as typeof console.error

    func()
    return calls
}

const prefix = "mouthwash_test_"
export function temp_dir(func: (dir:string) => void) {
    mkdtemp(`${tmpdir()}${sep}${prefix}`, (err, directory) => {
        if (err) throw err
        try {
            func(directory)
        }
        finally {
            rmSync(directory, { recursive: true, force: true })
        }
    })
}

export function temp_file(func: (file:string) => void) {
    const file_name = Math.random().toString(16).slice(2, 8)
    temp_dir((dir) => {
        const file_path = join(dir, file_name)
        func(file_path)
    })
}