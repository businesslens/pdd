import { execFileSync } from 'node:child_process'
import { appendFileSync, cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { branchState, describeBranchState } from '../src/core/branch-state.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')
const directories: string[] = []

function temporary(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  directories.push(directory)
  return directory
}

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'pipe' })
}

/** A fixture repository on `main`, then branched, so a merge base exists. */
function repository(): string {
  const root = temporary('bl-branch-')
  cpSync(FIXTURE, root, { recursive: true })
  git(root, 'init', '--initial-branch=main')
  git(root, 'config', 'user.email', 'fixture@example.com')
  git(root, 'config', 'user.name', 'Fixture')
  git(root, 'add', '.')
  git(root, 'commit', '-m', 'base')
  return root
}

const state = (root: string) => branchState(root, join(root, '.businesslens'))
const advice = (root: string) => describeBranchState(state(root)!).join('\n')

afterEach(() => {
  let directory = directories.pop()
  while (directory) {
    rmSync(directory, { recursive: true, force: true })
    directory = directories.pop()
  }
})

// Generous for the same reason the contribute suite is: every case drives real
// git several times over a copied fixture. These pass alone under the default
// 5s and time out when the whole suite runs in parallel.
describe('branchState', { timeout: 30_000 }, () => {
  it('reports nothing moved on an untouched branch', () => {
    const root = repository()
    git(root, 'checkout', '-b', 'feat/x')

    expect(state(root)).toMatchObject({ base: 'main', branch: 'feat/x', modelFiles: 0, codeFiles: 0 })
    expect(advice(root)).toContain('Nothing has moved')
  })

  it('sees an edited model before it is committed', () => {
    // Someone half-way through planning has not committed yet. Telling them
    // nothing had moved would be worse than saying nothing at all.
    const root = repository()
    git(root, 'checkout', '-b', 'feat/x')
    appendFileSync(join(root, '.businesslens', 'product.md'), '\n<!-- planned -->\n')

    expect(state(root)).toMatchObject({ modelFiles: 1, codeFiles: 0 })
    expect(advice(root)).toContain('described a change nobody has written yet')
  })

  it('counts untracked files, which a plain diff would miss', () => {
    const root = repository()
    git(root, 'checkout', '-b', 'feat/x')
    writeFileSync(join(root, 'src', 'services', 'new-thing.ts'), 'export const x = 1\n')

    expect(state(root)).toMatchObject({ modelFiles: 0, codeFiles: 1 })
  })

  it('separates the model from the code when both moved', () => {
    const root = repository()
    git(root, 'checkout', '-b', 'feat/x')
    appendFileSync(join(root, '.businesslens', 'product.md'), '\n<!-- planned -->\n')
    writeFileSync(join(root, 'src', 'services', 'new-thing.ts'), 'export const x = 1\n')

    expect(state(root)).toMatchObject({ modelFiles: 1, codeFiles: 1 })
    expect(advice(root)).toContain('nothing has checked that')
  })

  it('asks rather than asserts when only the code moved', () => {
    // Nothing here can tell a behavior change from a README edit, so claiming
    // drift that did not happen would train people to ignore the line.
    const root = repository()
    git(root, 'checkout', '-b', 'feat/x')
    writeFileSync(join(root, 'README.md'), '# notes\n')

    expect(state(root)).toMatchObject({ modelFiles: 0, codeFiles: 1 })
    const text = advice(root)
    expect(text).toContain('If any of that altered what the')
    expect(text).toContain('/businesslens-sync')
  })

  it('names each situation so a skill can route on it without re-deriving it', () => {
    const root = repository()
    git(root, 'checkout', '-b', 'feat/x')
    expect(state(root)!.situation).toBe('at-rest')

    appendFileSync(join(root, '.businesslens', 'product.md'), '\n<!-- planned -->\n')
    expect(state(root)!.situation).toBe('planned')

    writeFileSync(join(root, 'src', 'services', 'new-thing.ts'), 'export const x = 1\n')
    expect(state(root)!.situation).toBe('implemented')

    git(root, 'checkout', '--', '.businesslens')
    expect(state(root)!.situation).toBe('unplanned-code')
  })

  it('reports nothing at all when the answer cannot be trusted', () => {
    // The value of this is that it is mechanical rather than inferred, so a
    // repository it cannot read is a reason to stay quiet, not to guess.
    const bare = temporary('bl-branch-nogit-')
    cpSync(FIXTURE, bare, { recursive: true })
    expect(branchState(bare, join(bare, '.businesslens'))).toBeUndefined()

    const empty = temporary('bl-branch-empty-')
    git(empty, 'init', '--initial-branch=main')
    expect(branchState(empty, join(empty, '.businesslens'))).toBeUndefined()
  })
})
