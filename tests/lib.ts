type ConsoleMethod = "debug" | "info" | "warn" | "error";

export function capture_logs(fn: () => void): Array<{ method: ConsoleMethod; args: unknown[] }> {
    const calls: Array<{ method: ConsoleMethod; args: unknown[] }> = [];
    const originalDebug = console.debug;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.debug = ((...args: unknown[]) => {
        calls.push({ method: "debug", args });
    }) as typeof console.debug;
    console.info = ((...args: unknown[]) => {
        calls.push({ method: "info", args });
    }) as typeof console.info;
    console.warn = ((...args: unknown[]) => {
        calls.push({ method: "warn", args });
    }) as typeof console.warn;
    console.error = ((...args: unknown[]) => {
        calls.push({ method: "error", args });
    }) as typeof console.error;

    try {
        fn();
    } finally {
        console.debug = originalDebug;
        console.info = originalInfo;
        console.warn = originalWarn;
        console.error = originalError;
    }

    return calls;
}