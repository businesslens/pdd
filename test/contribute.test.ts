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
import { parse as parseYaml } from 'yaml'
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
function fakeGh(bin: string, capture: string, options: { authenticated?: boolean, ownsUpstream?: boolean } = {}): void {
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
if (args[0] === 'repo' && args[1] === 'fork') {
  const target = path.join(process.cwd(), 'pdd')
  fs.mkdirSync(target, { recursive: true })
  execFileSync('git', ['init', '--initial-branch=main'], { cwd: target, stdio: 'pipe' })
  execFileSync('git', ['config', 'user.email', 'fork@example.com'], { cwd: target, stdio: 'pipe' })
  execFileSync('git', ['config', 'user.name', 'Fork'], { cwd: target, stdio: 'pipe' })
  fs.writeFileSync(path.join(target, 'README.md'), '# pdd\\n')
  execFileSync('git', ['add', '-A'], { cwd: target, stdio: 'pipe' })
  execFileSync('git', ['commit', '-m', 'base'], { cwd: target, stdio: 'pipe' })
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

/** `git push` has nowhere to go in a test; stub it and let everything else be real. */
function fakeGitPush(bin: string): void {
  const file = join(bin, 'git')
  const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim()
  writeFileSync(
    file,
    `#!/usr/bin/env node
const { spawnSync } = require('node:child_process')
const args = process.argv.slice(2)
if (args.includes('push')) process.exit(0)
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
  it('opens a pull request whose Blueprint carries no source evidence', async () => {
    const model = temporary('bl-contribute-model-')
    const bin = temporary('bl-contribute-bin-')
    const capture = join(temporary('bl-contribute-capture-'), 'gh.json')

    // The fixture deliberately carries codeRefs — that is the leak being tested.
    cpSync(FIXTURE, model, { recursive: true })
    initialize(model)
    expect(readFileSync(join(model, '.businesslens/journeys/browse-and-buy/journey.md'), 'utf8'))
      .toContain('codeRefs:')

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
      const code = await runContribute(model, { slug: 'fixture-shop', yes: true })
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
    expect(files.some(file => file === 'blueprints/fixture-shop/blueprint.yaml')).toBe(true)
    expect(files.some(file => file.startsWith('blueprints/fixture-shop/.businesslens/'))).toBe(true)

    // The point of the whole flow: the model in the pull request is regenerated
    // from a redacted report, so no authored codeRef survives into it.
    const contents = recorded.prContents ?? {}
    const modelFiles = Object.entries(contents)
      .filter(([file]) => file.startsWith('blueprints/fixture-shop/.businesslens/'))
    expect(modelFiles.length).toBeGreaterThan(0)
    for (const [file, body] of modelFiles) {
      expect(body, `${file} leaks codeRefs`).not.toContain('codeRefs:')
      expect(body, `${file} leaks a source path`).not.toMatch(/src\/(services|routes)\//)
    }

    // Generated artifacts never travel.
    expect(files.some(file => file.includes('/.businesslens/build/'))).toBe(false)
    expect(files.some(file => file.includes('/.businesslens/cache/'))).toBe(false)

    const manifest = parseYaml(contents['blueprints/fixture-shop/blueprint.yaml']!) as Record<string, unknown>
    expect(manifest.slug).toBe('fixture-shop')
    expect(manifest.license).toBe('MIT')
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
      expect(await runContribute(model, { slug: 'fixture-shop', yes: true })).toBe(0)
    } finally {
      process.env.PATH = previousPath
      delete process.env.CAPTURE_FILE
    }

    const recorded = JSON.parse(readFileSync(capture, 'utf8')) as { calls: string[][], prFiles?: string[] }
    expect(recorded.calls.some(call => call[0] === 'repo' && call[1] === 'clone')).toBe(true)
    expect(recorded.calls.some(call => call[0] === 'repo' && call[1] === 'fork')).toBe(false)
    expect(recorded.prFiles?.some(file => file.startsWith('blueprints/fixture-shop/'))).toBe(true)
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
      expect(await runContribute(model, { slug: 'fixture-shop', yes: true })).toBe(1)
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
      expect(await runContribute(model, { slug: 'fixture-shop', yes: false })).toBe(2)
    } finally {
      process.env.PATH = previousPath
      delete process.env.CAPTURE_FILE
    }

    expect(errors.join('\n')).toContain('--yes')
    const recorded = JSON.parse(readFileSync(capture, 'utf8')) as { calls: string[][] }
    expect(recorded.calls.some(call => call[0] === 'repo')).toBe(false)
  })

  it('rejects a slug that is not a canonical name', async () => {
    const model = temporary('bl-contribute-slug-model-')
    const bin = temporary('bl-contribute-slug-bin-')
    const capture = join(temporary('bl-contribute-slug-capture-'), 'gh.json')

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
      expect(await runContribute(model, { slug: 'Not A Slug', yes: true })).toBe(1)
    } finally {
      process.env.PATH = previousPath
      delete process.env.CAPTURE_FILE
    }

    expect(errors.join('\n')).toContain('kebab-case')
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
      await runContribute(model, { slug: 'fixture-shop', yes: true })
    } finally {
      process.env.PATH = previousPath
      delete process.env.CAPTURE_FILE
    }

    const after = readdirSync(tmpdir()).filter(entry => entry.startsWith('businesslens-contribute-'))
    expect(after.length).toBe(before.length)
    expect(existsSync(join(model, 'blueprints'))).toBe(false)
  })
})
