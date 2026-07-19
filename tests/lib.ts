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