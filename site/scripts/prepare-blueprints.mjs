#!/usr/bin/env node
/**
 * Build every Blueprint under the repository's `blueprints/` into
 * `.data/blueprints`, the files the site's Blueprint pages are generated from.
 *
 * It runs the same release build CI publishes to the `blueprints-v<major>`
 * GitHub Release, so the site and `blueprint pull` show the same Blueprints. It
 * then records when each one was first and last changed, from Git, for the
 * cards and the feed.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const outDir = fileURLToPath(new URL('../.data/blueprints', import.meta.url))

const run = (command, args) => execFileSync(command, args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })

// The release build drives the CLI, and the report-parity test serves a model
// with `pdd-kit view`, so build the CLI and its viewer first when either is
// missing (a fresh checkout, as in CI).
const built = ['dist/cli.js', 'dist/viewer/index.html'].every(path => existsSync(new URL(path, `file://${repoRoot}`)))
if (!built) run('pnpm', ['build'])

rmSync(outDir, { recursive: true, force: true })
run(process.execPath, ['scripts/blueprints-release.mjs', outDir])

const index = JSON.parse(readFileSync(`${outDir}/index.json`, 'utf8'))
const dates = {}
for (const { slug } of index.blueprints) {
  const log = run('git', ['log', '--format=%cI', '--', `blueprints/${slug}`]).trim().split('\n').filter(Boolean)
  dates[slug] = { publishedAt: log.at(-1) ?? null, updatedAt: log[0] ?? null }
}
writeFileSync(`${outDir}/dates.json`, `${JSON.stringify(dates, null, 2)}\n`)
console.log(`Prepared ${index.blueprints.length} Blueprints in .data/blueprints.`)
