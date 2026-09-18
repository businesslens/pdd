import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fetchGithubSnapshot, parseGithubRepository, type GithubRepository } from '../src/core/github-repository.js'
import { resolveModelRoot } from '../src/core/model-root.js'
import { UsageError } from '../src/core/usage-error.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, stdio: 'pipe', encoding: 'utf8' }).trim()
}

describe('parseGithubRepository', () => {
  it('accepts the documented spellings and normalizes the clone URL', () => {
    const https = 'https://github.com/example/fixture-shop.git'
    expect(parseGithubRepository('example/fixture-shop')).toEqual({ owner: 'example', name: 'fixture-shop', cloneUrl: https })
    expect(parseGithubRepository('https://github.com/example/fixture-shop')).toEqual({ owner: 'example', name: 'fixture-shop', cloneUrl: https })
    expect(parseGithubRepository('https://github.com/example/fixture-shop.git/')).toEqual({ owner: 'example', name: 'fixture-shop', cloneUrl: https })
    expect(parseGithubRepository('github.com/example/fixture-shop')).toEqual({ owner: 'example', name: 'fixture-shop', cloneUrl: https })
    expect(parseGithubRepository('git@github.com:example/fixture-shop.git')).toEqual({
      owner: 'example', name: 'fixture-shop', cloneUrl: 'git@github.com:example/fixture-shop.git'
    })
  })

  it('reads a branch or pull request embedded in a GitHub URL', () => {
    expect(parseGithubRepository('https://github.com/example/fixture-shop/tree/feature/nested-name').ref)
      .toEqual({ kind: 'branch', name: 'feature/nested-name' })
    expect(parseGithubRepository('https://github.com/example/fixture-shop/pull/12').ref)
      .toEqual({ kind: 'pull', number: 12 })
  })

  it('rejects anything that is not a GitHub repository, branch, or pull request', () => {
    for (const value of [
      'https://gitlab.com/example/fixture-shop',
      'https://github.com/example',
      'https://github.com/example/fixture-shop/issues/3',
      'https://github.com/example/fixture-shop/pull/0',
      'https://github.com/example/fixture-shop/pull/12/files',
      'https://user:token@github.com/example/fixture-shop',
      'example',
      '../fixture-shop',
      'git@bitbucket.org:example/fixture-shop.git'
    ]) {
      expect(() => parseGithubRepository(value), value).toThrow(UsageError)
    }
  })
})

describe('fetchGithubSnapshot', () => {
  let origin: string
  let work: string
  let mainCommit: string
  let pullCommit: string

  beforeAll(() => {
    // A bare repository standing in for GitHub: a default branch, a feature
    // branch, and a `refs/pull/<n>/head` ref pointing at a commit that no
    // branch carries — the shape a fork's pull request has on the base.
    work = realpathSync(mkdtempSync(join(tmpdir(), 'bl-gh-work-')))
    cpSync(FIXTURE, work, { recursive: true })
    git(work, 'init', '--initial-branch=main')
    git(work, 'config', 'user.email', 'fixture@example.com')
    git(work, 'config', 'user.name', 'Fixture')
    git(work, 'add', '.')
    git(work, 'commit', '-q', '-m', 'fixture')
    mainCommit = git(work, 'rev-parse', 'HEAD')

    git(work, 'checkout', '-q', '-b', 'feature/rename')
    writeFileSync(join(work, 'README.md'), 'renamed on the feature branch\n')
    git(work, 'commit', '-q', '-am', 'feature')

    git(work, 'checkout', '-q', '--detach', 'main')
    writeFileSync(join(work, 'README.md'), 'from a fork\n')
    git(work, 'commit', '-q', '-am', 'fork change')
    pullCommit = git(work, 'rev-parse', 'HEAD')
    git(work, 'update-ref', 'refs/pull/7/head', pullCommit)
    git(work, 'checkout', '-q', 'main')

    origin = realpathSync(mkdtempSync(join(tmpdir(), 'bl-gh-origin-')))
    git(work, 'clone', '-q', '--bare', '--no-local', work, origin)
    // A bare clone copies branches and tags only; the pull head has to be
    // fetched across, the way GitHub materializes it on the base.
    git(origin, 'fetch', '-q', work, 'refs/pull/7/head:refs/pull/7/head')
    git(origin, 'symbolic-ref', 'HEAD', 'refs/heads/main')
  })

  afterAll(() => {
    rmSync(work, { recursive: true, force: true })
    rmSync(origin, { recursive: true, force: true })
  })

  function repository(): GithubRepository {
    return { owner: 'example', name: 'fixture-shop', cloneUrl: origin }
  }

  it('checks out the default branch as a shallow, detached snapshot the model resolves from', () => {
    const snapshot = fetchGithubSnapshot(repository(), undefined)
    try {
      expect(snapshot.commit).toBe(mainCommit)
      expect(git(snapshot.root, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('HEAD')
      expect(git(snapshot.root, 'rev-list', '--count', 'HEAD')).toBe('1')
      const resolved = resolveModelRoot(snapshot.root)
      expect(resolved.gitRoot).toBe(snapshot.root)
      expect(existsSync(join(resolved.modelRoot, '.businesslens', 'product'))).toBe(true)
    } finally {
      snapshot.dispose()
    }
    expect(existsSync(snapshot.root)).toBe(false)
  })

  it('fetches a named branch', () => {
    const snapshot = fetchGithubSnapshot(repository(), { kind: 'branch', name: 'feature/rename' })
    try {
      expect(readFileSync(join(snapshot.root, 'README.md'), 'utf8')).toBe('renamed on the feature branch\n')
    } finally {
      snapshot.dispose()
    }
  })

  it('fetches a pull request head that no branch of the base repository carries', () => {
    const snapshot = fetchGithubSnapshot(repository(), { kind: 'pull', number: 7 })
    try {
      expect(snapshot.commit).toBe(pullCommit)
      expect(readFileSync(join(snapshot.root, 'README.md'), 'utf8')).toBe('from a fork\n')
    } finally {
      snapshot.dispose()
    }
  })

  it('names the missing revision and leaves nothing behind when the fetch fails', () => {
    const before = new Set(readdirTmp())
    expect(() => fetchGithubSnapshot(repository(), { kind: 'pull', number: 99 }))
      .toThrow(/Could not fetch pull request #99 of example\/fixture-shop/)
    expect(() => fetchGithubSnapshot(repository(), { kind: 'branch', name: 'nope' }))
      .toThrow(/Could not fetch branch nope of example\/fixture-shop/)
    const leaked = readdirTmp().filter(entry => !before.has(entry))
    expect(leaked).toEqual([])
  })
})

function readdirTmp(): string[] {
  return readdirSync(tmpdir()).filter(entry => entry.startsWith('businesslens-view-'))
}
