#!/usr/bin/env node

// Roll [Unreleased] into the version in package.json.
//
//   npm version <version> --no-git-tag-version
//   npm run changelog:release [-- --base <ref>] [-- --date YYYY-MM-DD]
//
// Each entry is annotated with the pull request and squash commit that added
// it, found by blaming CHANGELOG.md at the base (default `origin/main`, so
// fetch first). Contributors are the GitHub authors of those commits. An entry
// that no merged commit added — one written in the release PR itself — is
// refused: its commit hash does not exist until that PR merges.

import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { changelogEntries, changelogSections, rollUnreleased } from './changelog.mjs'

const { values } = parseArgs({
  options: {
    base: { type: 'string', default: 'origin/main' },
    date: { type: 'string', default: new Date().toISOString().slice(0, 10) }
  }
})

const root = new URL('..', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 })

const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
const changelogFile = new URL('CHANGELOG.md', root)
const markdown = await readFile(changelogFile, 'utf8')

// Line number at the base → the commit that last wrote it, for the base's
// [Unreleased] entries only.
const commitByLine = new Map()
let current
for (const line of git('blame', '--porcelain', values.base, '--', 'CHANGELOG.md').split('\n')) {
  const header = /^([0-9a-f]{40}) \d+ (\d+)/.exec(line)
  if (header) {
    current = { sha: header[1], line: Number(header[2]) - 1 }
  } else if (line.startsWith('\t') && current) {
    commitByLine.set(current.line, current.sha)
  }
}
const base = git('show', `${values.base}:CHANGELOG.md`)
const baseUnreleased = changelogSections(base).find(section => section.label === 'Unreleased')
const commitByEntry = new Map((baseUnreleased ? changelogEntries(baseUnreleased.lines) : [])
  .map(entry => [entry.text, commitByLine.get(baseUnreleased.start + 1 + entry.first)]))

const pullRequest = sha => Number(/\(#(\d+)\)\s*$/.exec(git('log', '-1', '--format=%s', sha).trim())?.[1]) || undefined

const commits = new Set()
const provenance = (text) => {
  const sha = commitByEntry.get(text)
  if (!sha) return undefined
  commits.add(sha)
  return { sha, pr: pullRequest(sha) }
}

// Resolve every entry first so the contributors cover exactly the commits used.
const unreleased = changelogSections(markdown).find(section => section.label === 'Unreleased')
for (const entry of unreleased ? changelogEntries(unreleased.lines) : []) provenance(entry.text)

const contributors = [...new Set([...commits].map(sha =>
  execFileSync('gh', ['api', `repos/businesslens/pdd/commits/${sha}`, '--jq', '.author.login'], { encoding: 'utf8' }).trim()))]
  .filter(login => login && !login.endsWith('[bot]'))
  .sort((a, b) => a.localeCompare(b))

try {
  await writeFile(changelogFile, rollUnreleased(markdown, { version: pkg.version, date: values.date, provenance, contributors }))
} catch (error) {
  console.error(`error: ${error.message}`)
  process.exit(1)
}
console.log(`Released [Unreleased] as ${pkg.version} with ${commits.size} commit(s) from ${contributors.join(', ')}.`)
