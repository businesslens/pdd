import { execFileSync } from 'node:child_process'
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runContribute } from '../src/commands/contribute.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')
const temporaryDirectories: string[] = []

function temporary(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'pipe' })
}

function initialize(cwd: string): void {
  git(cwd, 'init', '--initial-branch=main')
  git(cwd, 'config', 'user.email', 'fixture@example.com')
  git(cwd, 'config', 'user.name', 'Fixture')
  git(cwd, 'remote', 'add', 'origin', 'https://github.com/example/fixture-shop.git')
  git(cwd, 'add', '.')
  git(cwd, 'commit', '-m', 'fixture')
}

/**
 * A `gh` that records what it was asked to do and fakes the one command with a
 * side effect the flow depends on: `repo fork --clone` must leave a repository
 * behind for the Blueprint to be written into.
 */
function fakeGh(
  bin: string,
  capture: string,
  options: { authenticated?: boolean, ownsUpstream?: boolean, syncFails?: boolean, existingPr?: string } = {}
): void {
  const file = join(bin, 'gh')
  writeFileSync(
    file,
    `#!/usr/bin/env node
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const args = process.argv.slice(2)
const record = { calls: [] }
try {
  Object.assign(record, JSON.parse(fs.readFileSync(process.env.CAPTURE_FILE, 'utf8')))
} catch {}
record.calls.push(args)
fs.writeFileSync(process.env.CAPTURE_FILE, JSON.stringify(record))

if (args[0] === '--version') { console.log('gh version 2.0.0'); process.exit(0) }
if (args[0] === 'auth') { process.exit(${options.authenticated === false ? 1 : 0}) }
if (args[0] === 'api' && args[1] === 'user') { console.log('contributor'); process.exit(0) }
if (args[0] === 'repo' && args[1] === 'view') { console.log(${options.ownsUpstream ? "'contributor'" : "'businesslens'"}); process.exit(0) }
if (args[0] === 'repo' && args[1] === 'clone') {
  const target = args[3]
  fs.mkdirSync(target, { recursive: true })
  execFileSync('git', ['init', '--initial-branch=main'], { cwd: target, stdio: 'pipe' })
  execFileSync('git', ['config', 'user.email', 'owner@example.com'], { cwd: target, stdio: 'pipe' })
  execFileSync('git', ['config', 'user.name', 'Owner'], { cwd: target, stdio: 'pipe' })
  fs.writeFileSync(path.join(target, 'README.md'), '# pdd\\n')
  execFileSync('git', ['add', '-A'], { cwd: target, stdio: 'pipe' })
  execFileSync('git', ['commit', '-m', 'base'], { cwd: target, stdio: 'pipe' })
  process.exit(0)
}
// Creating the fork has no local side effect: the flow passes --clone=false and
// clones the fork by name in a separate step, so the checkout path is its own.
if (args[0] === 'repo' && args[1] === 'fork') { process.exit(0) }
if (args[0] === 'repo' && args[1] === 'sync') { process.exit(${options.syncFails ? 1 : 0}) }
if (args[0] === 'pr' && args[1] === 'list') {
  ${options.existingPr ? `console.log(${JSON.stringify(options.existingPr)})` : ""}
  process.exit(0)
}
if (args[0] === 'pr' && args[1] === 'create') {
  // Capture the tree that would have been pushed, before the temp dir is removed.
  const staged = execFileSync('git', ['show', '--name-only', '--pretty=format:', 'HEAD'], {
    cwd: process.cwd(), encoding: 'utf8'
  })
  record.prFiles = staged.split('\\n').filter(Boolean)
  record.prBody = args[args.indexOf('--body') + 1]
  const blueprintDir = record.prFiles
    .map(file => path.join(process.cwd(), file))
    .filter(file => fs.existsSync(file))
  record.prContents = Object.fromEntries(
    blueprintDir.map(file => [path.relative(process.cwd(), file), fs.readFileSync(file, 'utf8')])
  )
  fs.writeFileSync(process.env.CAPTURE_FILE, JSON.stringify(record))
  console.log('https://github.com/businesslens/pdd/pull/1')
  process.exit(0)
}
process.exit(0)
`
  )
  chmodSync(file, 0o755)
}

/**
 * `git push` has nowhere to go in a test; stub it and let everything else be
 * real. The stub records what it was asked to push, because how the branch is
 * pushed is itself behavior worth pinning.
 */
function fakeGitPush(bin: string): void {
  const file = join(bin, 'git')
  const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim()
  writeFileSync(
    file,
    `#!/usr/bin/env node
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const args = process.argv.slice(2)
if (args.includes('push')) {
  const record = { calls: [], pushes: [] }
  try { Object.assign(record, JSON.parse(fs.readFileSync(process.env.CAPTURE_FILE, 'utf8'))) } catch {}
  record.pushes = record.pushes || []
  record.pushes.push(args)
  fs.writeFileSync(process.env.CAPTURE_FILE, JSON.stringify(record))
  process.exit(0)
}
const result = spawnSync(${JSON.stringify(realGit)}, args, { stdio: 'inherit' })
process.exit(result.status ?? 1)
`
  )
  chmodSync(file, 0o755)
}

afterEach(() => {
  vi.restoreAllMocks()
  let directory = temporaryDirectories.pop()
  while (directory) {
    rmSync(directory, { recursive: true, force: true })
    directory = temporaryDirectories.pop()
  }
})

// Deliberately generous: each case drives real git twice — once for the model
// repository and once for the simulated fork — plus a full build and report
// expansion. Under the default 5s these pass alone and time out when the whole
// suite runs in parallel.
describe('contribute', { timeout: 30_000 }, () => {
  it('opens a pull request whose Blueprint carries no workspace material', async () => {
    const model = temporary('bl-contribute-model-')
    const bin = temporary('bl-contribute-bin-')
    const capture = join(temporary('bl-contribute-capture-'), 'gh.json')

    // The fixture deliberately carries code references — that is the leak being tested.
    cpSync(FIXTURE, model, { recursive: true })
    initialize(model)
    expect(readFileSync(join(model, '.businesslens/journeys/browse-and-buy/journey.md'), 'utf8'))
      .toContain('kind: code')

    fakeGh(bin, capture)
    fakeGitPush(bin)
    const previousPath = process.env.PATH
    const previousCapture = process.env.CAPTURE_FILE
    process.env.PATH = `${bin}${delimiter}${previousPath || ''}`
    process.env.CAPTURE_FILE = capture
    writeFileSync(capture, '{}')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const failures: string[] = []
    vi.spyOn(console, 'error').mockImplementation((m: string) => { failures.push(m) })

    try {
      const code = await runContribute(model, { yes: true })
      expect(failures.join('\n')).toBe('')
      expect(code).toBe(0)
    } finally {
      process.env.PATH = previousPath
      if (previousCapture === undefined) delete process.env.CAPTURE_FILE
      else process.env.CAPTURE_FILE = previousCapture
    }

    const recorded = JSON.parse(readFileSync(capture, 'utf8')) as {
      calls: string[][]
      prFiles?: string[]
      prContents?: Record<string, string>
    }

    // Preflight, fork, and pull request all happened.
    expect(recorded.calls[0]).toEqual(['--version'])
    expect(recorded.calls.some(call => call[0] === 'auth')).toBe(true)
    expect(recorded.calls.some(call => call[0] === 'repo' && call[1] === 'fork')).toBe(true)

    const files = recorded.prFiles ?? []
    expect(files.some(file => file === 'blueprints/fixture-shop/blueprint.yaml')).toBe(false)
    expect(files.some(file => file.startsWith('blueprints/fixture-shop/.businesslens/'))).toBe(true)
    expect(files).toContain('blueprints/fixture-shop/.businesslens/logo.svg')

    // The point of the whole flow: the model in the pull request is regenerated
    // from a portable report, so no workspace reference survives into it.
    const contents = recorded.prContents ?? {}
    expect(contents['blueprints/fixture-shop/.businesslens/README.md'])
      .toContain('BusinessLens Product Model')
    expect(contents['blueprints/fixture-shop/.businesslens/logo.svg']).toContain('<svg')
    const modelFiles = Object.entries(contents)
      .filter(([file]) => file.startsWith('blueprints/fixture-shop/.businesslens/'))
    expect(modelFiles.length).toBeGreaterThan(0)
    for (const [file, body] of modelFiles) {
      expect(body, `${file} leaks a code reference`).not.toContain('kind: code')
      expect(body, `${file} leaks an implementation reference`).not.toContain('role: implementation')
      expect(body, `${file} leaks a source path`).not.toMatch(/src\/(services|routes)\//)
    }

    // Generated artifacts never travel.
    expect(files.some(file => file.includes('/.businesslens/build/'))).toBe(false)
    expect(files.some(file => file.includes('/.businesslens/cache/'))).toBe(false)

    // There is no catalog-specific manifest: every Product-facing field comes
    // from this canonical model, and every contributed file is BusinessLens-owned.
    expect(files
      .filter(file => file.startsWith('blueprints/fixture-shop/'))
      .every(file => file.startsWith('blueprints/fixture-shop/.businesslens/'))).toBe(true)
    expect(JSON.stringify(contents)).not.toContain('fixture-shop.git')
    expect(JSON.stringify(contents)).not.toContain('github.com/example')
  })

  it('clones instead of forking when the contributor owns the upstream', async () => {
    // GitHub refuses to let one account own both a parent and a fork, so a
    // maintainer contributing to their own repository cannot fork it. Found by
    // running the real flow against a scratch upstream.
    const model = temporary('bl-contribute-own-model-')
    const bin = temporary('bl-contribute-own-bin-')
    const capture = join(temporary('bl-contribute-own-capture-'), 'gh.json')

    cpSync(FIXTURE, model, { recursive: true })
    initialize(model)
    fakeGh(bin, capture, { ownsUpstream: true })
    fakeGitPush(bin)

    const previousPath = process.env.PATH
    process.env.PATH = `${bin}${delimiter}${previousPath || ''}`
    process.env.CAPTURE_FILE = capture
    writeFileSync(capture, '{}')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    try {
      expect(await runContribute(model, { yes: true })).toBe(0)
    } finally {
      process.env.PATH = previousPath
      delete process.env.CAPTURE_FILE
    }

    const recorded = JSON.parse(readFileSync(capture, 'utf8')) as { calls: string[][], prFiles?: string[] }
    expect(recorded.calls.some(call => call[0] === 'repo' && call[1] === 'clone')).toBe(true)
    expect(recorded.calls.some(call => call[0] === 'repo' && call[1] === 'fork')).toBe(false)
    expect(recorded.prFiles?.some(file => file.startsWith('blueprints/fixture-shop/'))).toBe(true)
  })

  it('syncs the fork from upstream before branching off it', async () => {
    // A fork left from an earlier contribution keeps whatever `main` it had
    // then. Branching off that stale history puts unrelated commits — or a
    // conflict — into the pull request.
    const model = temporary('bl-contribute-sync-model-')
    const bin = temporary('bl-contribute-sync-bin-')
    const capture = join(temporary('bl-contribute-sync-capture-'), 'gh.json')

    cpSync(FIXTURE, model, { recursive: true })
    initialize(model)
    fakeGh(bin, capture)
    fakeGitPush(bin)

    const previousPath = process.env.PATH
    process.env.PATH = `${bin}${delimiter}${previousPath || ''}`
    process.env.CAPTURE_FILE = capture
    writeFileSync(capture, '{}')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    try {
      expect(await runContribute(model, { yes: true })).toBe(0)
    } finally {
      process.env.PATH = previousPath
      delete process.env.CAPTURE_FILE
    }

    const recorded = JSON.parse(readFileSync(capture, 'utf8')) as { calls: string[][] }
    const index = (first: string, second: string) =>
      recorded.calls.findIndex(call => call[0] === first && call[1] === second)

    const sync = recorded.calls.find(call => call[0] === 'repo' && call[1] === 'sync')
    expect(sync).toEqual(['repo', 'sync', 'contributor/pdd', '--source', 'businesslens/pdd', '--branch', 'main', '--force'])

    // Order is the whole point: syncing after the clone would fix nothing.
    expect(index('repo', 'fork')).toBeLessThan(index('repo', 'sync'))
    expect(index('repo', 'sync')).toBeLessThan(index('repo', 'clone'))
  })

  it('force-pushes its own branch, and reports an existing pull request', async () => {
    // Every run rebuilds from upstream main, so a revised submission always
    // diverges from whatever the previous attempt left on `blueprint/<slug>`.
    // GitHub also rejects a second pull request for a branch that already has
    // one — and by then the push has already updated it.
    const model = temporary('bl-contribute-again-model-')
    const bin = temporary('bl-contribute-again-bin-')
    const capture = join(temporary('bl-contribute-again-capture-'), 'gh.json')

    cpSync(FIXTURE, model, { recursive: true })
    initialize(model)
    fakeGh(bin, capture, { existingPr: 'https://github.com/businesslens/pdd/pull/7' })
    fakeGitPush(bin)

    const previousPath = process.env.PATH
    process.env.PATH = `${bin}${delimiter}${previousPath || ''}`
    process.env.CAPTURE_FILE = capture
    writeFileSync(capture, '{}')
    const logs: string[] = []
    vi.spyOn(console, 'log').mockImplementation(message => { logs.push(String(message)) })

    try {
      expect(await runContribute(model, { yes: true })).toBe(0)
    } finally {
      process.env.PATH = previousPath
      delete process.env.CAPTURE_FILE
    }

    const recorded = JSON.parse(readFileSync(capture, 'utf8')) as { calls: string[][], pushes?: string[][] }
    const push = recorded.pushes?.find(args => args.includes('push'))
    expect(push).toContain('--force')
    expect(push).toContain('HEAD:refs/heads/blueprint/fixture-shop')

    // The head is qualified with the fork owner, or GitHub cannot find it.
    expect(recorded.calls.find(call => call[0] === 'pr' && call[1] === 'list'))
      .toContain('contributor:blueprint/fixture-shop')

    expect(logs.join('\n')).toContain('Updated https://github.com/businesslens/pdd/pull/7')
    expect(recorded.calls.some(call => call[0] === 'pr' && call[1] === 'create')).toBe(false)
  })

  it('refuses rather than contributing from a fork it could not sync', async () => {
    const model = temporary('bl-contribute-stale-model-')
    const bin = temporary('bl-contribute-stale-bin-')
    const capture = join(temporary('bl-contribute-stale-capture-'), 'gh.json')

    cpSync(FIXTURE, model, { recursive: true })
    initialize(model)
    fakeGh(bin, capture, { syncFails: true })
    fakeGitPush(bin)

    const previousPath = process.env.PATH
    process.env.PATH = `${bin}${delimiter}${previousPath || ''}`
    process.env.CAPTURE_FILE = capture
    writeFileSync(capture, '{}')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const errors: string[] = []
    vi.spyOn(console, 'error').mockImplementation(message => { errors.push(String(message)) })

    try {
      expect(await runContribute(model, { yes: true })).toBe(1)
    } finally {
      process.env.PATH = previousPath
      delete process.env.CAPTURE_FILE
    }

    expect(errors.join('\n')).toContain('Could not bring contributor/pdd up to date')
    const recorded = JSON.parse(readFileSync(capture, 'utf8')) as { calls: string[][] }
    expect(recorded.calls.some(call => call[0] === 'pr' && call[1] === 'create')).toBe(false)
  })

  it('refuses without an authenticated GitHub CLI, before touching anything', async () => {
    const model = temporary('bl-contribute-unauth-model-')
    const bin = temporary('bl-contribute-unauth-bin-')
    const capture = join(temporary('bl-contribute-unauth-capture-'), 'gh.json')

    cpSync(FIXTURE, model, { recursive: true })
    initialize(model)
    fakeGh(bin, capture, { authenticated: false })

    const previousPath = process.env.PATH
    process.env.PATH = `${bin}${delimiter}${previousPath || ''}`
    process.env.CAPTURE_FILE = capture
    writeFileSync(capture, '{}')
    const errors: string[] = []
    vi.spyOn(console, 'error').mockImplementation((message: string) => { errors.push(message) })

    try {
      expect(await runContribute(model, { yes: true })).toBe(1)
    } finally {
      process.env.PATH = previousPath
      delete process.env.CAPTURE_FILE
    }

    expect(errors.join('\n')).toContain('gh auth login')
    const recorded = JSON.parse(readFileSync(capture, 'utf8')) as { calls: string[][] }
    expect(recorded.calls.some(call => call[0] === 'repo')).toBe(false)
  })

  it('refuses to open a pull request unconfirmed in a non-interactive session', async () => {
    const model = temporary('bl-contribute-tty-model-')
    const bin = temporary('bl-contribute-tty-bin-')
    const capture = join(temporary('bl-contribute-tty-capture-'), 'gh.json')

    cpSync(FIXTURE, model, { recursive: true })
    initialize(model)
    fakeGh(bin, capture)

    const previousPath = process.env.PATH
    process.env.PATH = `${bin}${delimiter}${previousPath || ''}`
    process.env.CAPTURE_FILE = capture
    writeFileSync(capture, '{}')
    const errors: string[] = []
    vi.spyOn(console, 'error').mockImplementation((message: string) => { errors.push(message) })

    try {
      // vitest runs without a TTY, which is the condition being exercised.
      expect(await runContribute(model, { yes: false })).toBe(2)
    } finally {
      process.env.PATH = previousPath
      delete process.env.CAPTURE_FILE
    }

    expect(errors.join('\n')).toContain('--yes')
    const recorded = JSON.parse(readFileSync(capture, 'utf8')) as { calls: string[][] }
    expect(recorded.calls.some(call => call[0] === 'repo')).toBe(false)
  })

  it('leaves no temporary working directory behind', async () => {
    const model = temporary('bl-contribute-cleanup-model-')
    const bin = temporary('bl-contribute-cleanup-bin-')
    const capture = join(temporary('bl-contribute-cleanup-capture-'), 'gh.json')

    cpSync(FIXTURE, model, { recursive: true })
    initialize(model)
    fakeGh(bin, capture)
    fakeGitPush(bin)

    const before = readdirSync(tmpdir()).filter(entry => entry.startsWith('businesslens-contribute-'))

    const previousPath = process.env.PATH
    process.env.PATH = `${bin}${delimiter}${previousPath || ''}`
    process.env.CAPTURE_FILE = capture
    writeFileSync(capture, '{}')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    try {
      await runContribute(model, { yes: true })
    } finally {
      process.env.PATH = previousPath
      delete process.env.CAPTURE_FILE
    }

    const after = readdirSync(tmpdir()).filter(entry => entry.startsWith('businesslens-contribute-'))
    expect(after.length).toBe(before.length)
    expect(existsSync(join(model, 'blueprints'))).toBe(false)
  })
})
