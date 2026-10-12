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

// The release build drives the CLI, so the CLI has to be built first.
if (!existsSync(new URL('dist/cli.js', `file://${repoRoot}`))) run('pnpm', ['build:core'])

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
