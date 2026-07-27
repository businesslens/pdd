#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

function fail(message) {
  process.stderr.write(`${message}\n`)
  process.exit(2)
}

const args = process.argv.slice(2)
const rootIndex = args.indexOf('--root')
const requestedRoot = rootIndex >= 0 ? args[rootIndex + 1] : undefined
if (!requestedRoot) {
  fail('Usage: run-businesslens.mjs --root <repository> validate [--json]')
}

const commandArgs = args.filter(
  (_, index) => index !== rootIndex && index !== rootIndex + 1
)
if (commandArgs[0] !== 'validate') {
  fail('The isolated BusinessLens runner supports only validate.')
}

let root
try {
  root = resolve(execFileSync(
    'git',
    ['-C', resolve(requestedRoot), 'rev-parse', '--show-toplevel'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  ).trim())
} catch {
  fail('The BusinessLens runner must target a Git repository.')
}

const runnerRoot = mkdtempSync(join(tmpdir(), 'businesslens-cli-'))
const env = { ...process.env }
delete env.BUSINESSLENS_API_KEY

try {
  execFileSync(
    'npm',
    [
      'exec',
      '--yes',
      '--ignore-scripts',
      '--package=businesslens@latest',
      '--',
      'businesslens',
      '--cwd',
      root,
      ...commandArgs
    ],
    {
      cwd: runnerRoot,
      env,
      stdio: 'inherit'
    }
  )
} catch (error) {
  process.exitCode = typeof error.status === 'number' ? error.status : 1
} finally {
  rmSync(runnerRoot, { recursive: true, force: true })
}
