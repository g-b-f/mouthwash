import { Category, Intensity } from "better-profane-words"

export type ProfanityFinding = {
    line: string
    lineNum: number
}

export type ProfanityResult = {
    isProfane: boolean
    file: string
    lines?: ProfanityFinding[]
}

export type ReadOptions = {
    ignore_leading_dot: boolean
    ignore_files: string[]
    ignore_dirs: string[]
    concurrent_threads: number
    check_binary_files: boolean
}

export const default_read_options: ReadOptions = {
    ignore_leading_dot: true,
    ignore_files: [".gitignore"],
    ignore_dirs: [".git"],
    concurrent_threads: 10,
    check_binary_files: false
}

export type ReportOptions = {
    min_intensity: Intensity
    display_profanity: boolean
    categories?: Category[]
}

export const default_report_options: ReportOptions = {
    min_intensity: 2,
    display_profanity: true
}