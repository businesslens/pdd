#!/usr/bin/env node
/**
 * Typecheck the Nuxt layer consumer fixture against this checkout's package.
 *
 * Publish smoke-tests the same fixture against the packed artifact, but only
 * after the release is tagged. A Product Report schema change that leaves the
 * fixture's sample report behind passed every PR check and failed there (0.25.0
 * kept `navigation` in it). This runs the fixture's `prepare:nuxt` and
 * `typecheck` in `npm run verify`, so the drift fails the pull request instead.
 *
 * It packs without lifecycle scripts, so run it after `npm run build`. The
 * fixture's own dependencies are installed from the registry into a temporary
 * copy; nothing is written inside the repository.
 *
 * Usage: npm run check:consumer
 */
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixture = resolve(root, 'test/fixtures/nuxt-layer-consumer')
const work = mkdtempSync(join(tmpdir(), 'businesslens-nuxt-consumer-'))
const quiet = ['--no-audit', '--no-fund', '--loglevel=error']
const run = (args, cwd) => execFileSync('npm', args, { cwd, stdio: 'inherit' })

try {
  run(['pack', '--ignore-scripts', '--pack-destination', work, ...quiet], root)
  const tarball = join(work, readdirSync(work).find(name => name.endsWith('.tgz')))
  const app = join(work, 'app')
  cpSync(fixture, app, { recursive: true })
  run(['install', '--ignore-scripts', ...quiet], app)
  run(['install', '--ignore-scripts', '--no-save', ...quiet, tarball], app)
  run(['run', 'prepare:nuxt'], app)
  run(['run', 'typecheck'], app)
  console.log('The Nuxt layer consumer fixture typechecks against this checkout.')
} finally {
  rmSync(work, { recursive: true, force: true })
}
