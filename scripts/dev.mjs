#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { activateDevelopmentLink, removeDevelopmentLink } from './dev-link.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (args.length > 1 || (args[0] && args[0] !== '--unlink')) {
  fail('Usage: npm run dev [-- --unlink]')
}

try {
  if (args[0] === '--unlink') {
    const result = removeDevelopmentLink(root)
    console.log(result.removed
      ? `Removed ${result.link}.`
      : `No BusinessLens development link exists at ${result.link}.`)
    process.exit(0)
  }

  const tsdown = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsdown.cmd' : 'tsdown')
  if (!existsSync(tsdown)) fail('Dependencies are not installed. Run `npm ci` first.')

  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  console.log('Building BusinessLens and the local viewer before activation...')
  const build = spawnSync(npm, ['run', 'build'], { cwd: root, stdio: 'inherit' })
  if (build.error) fail(build.error.message)
  if (build.status !== 0) process.exit(build.status ?? 1)

  const { link } = activateDevelopmentLink(root)
  const branch = spawnSync('git', ['-C', root, 'branch', '--show-current'], { encoding: 'utf8' })
  console.log(`Active development command: ${link}`)
  console.log(`PDD worktree: ${root}`)
  console.log(`Branch: ${branch.status === 0 ? branch.stdout.trim() || '(detached)' : '(unknown)'}`)
  console.log('Watching BusinessLens package outputs. Press Ctrl+C to stop watching; the link remains active.')

  // The initial full build owns cleanup. Preserve its packaged viewer while
  // tsdown refreshes the CLI bundle during development.
  const watcher = spawn(tsdown, ['--watch', '--no-clean'], { cwd: root, stdio: 'inherit' })
  watcher.on('error', error => fail(error.message))
  watcher.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal)
    else process.exit(code ?? 1)
  })
} catch (error) {
  fail(error.message)
}
