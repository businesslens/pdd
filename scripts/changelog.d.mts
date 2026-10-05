export const REPOSITORY: string

export interface ChangelogSection {
  label: string
  start: number
  end: number
  lines: string[]
}

export interface ChangelogEntry {
  first: number
  last: number
  text: string
}

export function changelogSections(markdown: string): ChangelogSection[]

export function changelogDefinitions(markdown: string): Map<string, string>

export function changelogEntries(sectionLines: string[]): ChangelogEntry[]

export function changelogProblems(markdown: string): string[]

export function annotateEntries(
  sectionLines: string[],
  provenance: (entryText: string) => { pr?: number, sha: string } | undefined
): { lines: string[], unknown: string[] }

export function rollUnreleased(markdown: string, options: {
  version: string
  date: string
  provenance: (entryText: string) => { pr?: number, sha: string } | undefined
  contributors: string[]
}): string

export function releaseFooter(label: string, url: string, contributors: string[]): string[]
