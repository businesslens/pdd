#!/usr/bin/env node
/**
 * Open a nested model in the local Product Report, as its own repository.
 *
 * `businesslens view` resolves every code reference against `git ls-files` of
 * the repository it finds by walking up. A model that sits inside this
 * repository — the golden lint fixture above all — therefore fails lint from
 * where it lives: its `src/services/orders.ts` is tracked here only as
 * `test/fixtures/fixture-shop/src/services/orders.ts`. The tests copy the
 * fixture into a temporary repository before linting it, and this script does
 * the same for a person: copy, `git init`, add, then run the real CLI there.
 *
 * Edits still land in the fixture. The copy is watched back from the source,
 * so a save in `test/fixtures/fixture-shop/` re-syncs and the viewer recompiles
 * exactly as it would on a model at its own root. Nothing is written to the
 * source tree, and the copy is removed on exit.
 *
 * Usage: npm run view:fixture [-- [model-dir] [--port <port>] [--no-open]]
 */
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, rmSync, watch } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cli = join(root, 'dist', 'cli.js')
const viewArgs = []
let model = 'test/fixtures/fixture-shop'
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index]
  if (arg === '--port') viewArgs.push(arg, process.argv[++index] ?? '')
  else if (arg.startsWith('--')) viewArgs.push(arg)
  else model = arg
}
const source = resolve(root, model)

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (!existsSync(cli)) fail('dist/cli.js is missing. Run `npm run build:core` first.')
if (!existsSync(join(source, '.businesslens'))) fail(`${source} holds no .businesslens/ directory.`)

function git(cwd, ...gitArgs) {
  const result = spawnSync('git', gitArgs, { cwd, encoding: 'utf8' })
  if (result.status !== 0) fail(`git ${gitArgs.join(' ')} failed:\n${result.stderr}`)
  return result.stdout
}

/* The generated folders are not part of the fixture; the copy grows its own. */
const skip = (path) => /(^|\/)\.businesslens\/(build|cache)(\/|$)/.test(relative(source, path))

const copy = mkdtempSync(join(tmpdir(), 'bl-view-'))
cpSync(source, copy, { recursive: true, filter: path => !skip(path) })
git(copy, 'init', '--quiet', '--initial-branch=main')
git(copy, 'config', 'user.email', 'view@businesslens.local')
git(copy, 'config', 'user.name', 'businesslens view')
git(copy, 'add', '--all')
git(copy, 'commit', '--quiet', '--message', 'fixture')
console.log(`Viewing ${relative(root, source) || source} as its own repository at ${copy}`)

/* A save in the source lands in the copy, and a new file becomes tracked. */
let pending
const watcher = watch(source, { recursive: true }, (_, file) => {
  if (!file || skip(join(source, file))) return
  clearTimeout(pending)
  pending = setTimeout(() => {
    cpSync(source, copy, { recursive: true, filter: path => !skip(path) })
    git(copy, 'add', '--all')
  }, 150)
})

const viewer = spawn(process.execPath, [cli, 'view', ...viewArgs], { cwd: copy, stdio: 'inherit' })

function stop(code) {
  watcher.close()
  rmSync(copy, { recursive: true, force: true })
  process.exit(code)
}
viewer.on('exit', code => stop(code ?? 0))
viewer.on('error', error => { console.error(error.message); stop(1) })
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => { viewer.kill(signal) })
}
