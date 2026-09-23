import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'

const CLI = join(__dirname, '..', 'dist', 'cli.js')
const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')
const directories: string[] = []
const children: ChildProcess[] = []
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, stdio: 'pipe' })
const scratch = () => {
  const directory = mkdtempSync(join(tmpdir(), 'bl-view-recovery-'))
  directories.push(directory)
  return directory
}

afterEach(async () => {
  for (const child of children.splice(0)) {
    if (child.exitCode !== null || child.signalCode !== null) continue
    await new Promise<void>(resolve => {
      const timeout = setTimeout(() => child.kill('SIGKILL'), 3000)
      child.once('exit', () => { clearTimeout(timeout); resolve() })
      child.kill('SIGTERM')
    })
  }
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

async function start(cwd: string) {
  const child = spawn(process.execPath, [CLI, 'view', '--cwd', cwd, '--no-open'], { stdio: 'pipe' })
  children.push(child)
  let output = ''
  child.stdout.on('data', data => { output += data })
  child.stderr.on('data', data => { output += data })
  await expect.poll(() => output, { timeout: 10_000 }).toMatch(/http:\/\/127\.0\.0\.1:\d+/)
  return output.match(/http:\/\/127\.0\.0\.1:\d+/)![0]
}

async function state(url: string) {
  const response = await fetch(`${url}/_businesslens/report.json`)
  const body = await response.json() as { id?: string, message?: string }
  return { status: response.status, state: response.headers.get('x-businesslens-report-state'), body }
}

async function ready(url: string) {
  await expect.poll(async () => {
    const result = await state(url)
    return [result.status, result.state, result.body.id]
  }, { timeout: 15_000 }).toEqual([200, 'ready', 'fixture-shop'])
}

it('finds a model at a repository root initialized after view started in a subdirectory', async () => {
  const root = scratch()
  const cwd = join(root, 'work')
  mkdirSync(cwd)
  const url = await start(cwd)
  expect((await state(url)).status).toBe(422)
  git(root, 'init', '--initial-branch=main')
  cpSync(FIXTURE, root, { recursive: true })
  git(root, 'add', '.')
  await ready(url)
  const preview = await fetch(`${url}/_businesslens/code?target=src/services/catalog.ts%23CatalogService.list`)
  expect(preview.status).toBe(200)
  await preview.text()
})

it('rebinds a model already on screen when its enclosing repository is initialized', async () => {
  const root = scratch()
  cpSync(FIXTURE, root, { recursive: true })
  const url = await start(root)
  expect((await state(url)).status).toBe(422)
  git(root, 'init', '--initial-branch=main')
  git(root, 'add', '.')
  await ready(url)
})

it.each([false, true])('recovers from index-only edits (linked worktree: %s)', async linked => {
  const parent = scratch()
  const repository = join(parent, 'repository')
  mkdirSync(repository)
  git(repository, 'init', '--initial-branch=main')
  let root = repository
  if (linked) {
    git(repository, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '--allow-empty', '-m', 'Initial')
    root = join(parent, 'worktree')
    git(repository, 'worktree', 'add', '-b', 'viewer', root)
  }
  cpSync(FIXTURE, root, { recursive: true })
  // No index exists yet in the ordinary repository.
  const url = await start(root)
  expect((await state(url)).status).toBe(422)
  git(root, 'add', '.')
  await ready(url)
  git(root, 'rm', '--cached', 'src/services/catalog.ts')
  await expect.poll(async () => (await state(url)).state, { timeout: 15_000 }).toBe('stale')
  git(root, 'add', 'src/services/catalog.ts')
  await ready(url)
})
