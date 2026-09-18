import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { git } from './git.js'
import { UsageError } from './usage-error.js'

/** The revision of a GitHub repository to fetch. Absent means its default branch. */
export type GithubRef =
  | { kind: 'branch', name: string }
  | { kind: 'pull', number: number }

export interface GithubRepository {
  owner: string
  name: string
  /** Where `git fetch` reads from: HTTPS by default, SSH when the input was SSH. */
  cloneUrl: string
  /** A revision embedded in the input, as in `.../tree/<branch>` or `.../pull/<n>`. */
  ref?: GithubRef
}

/** A fetched snapshot: a detached, depth-one checkout in a temporary directory. */
export interface GithubSnapshot {
  root: string
  commit: string
  /** Remove the temporary checkout. Safe to call more than once. */
  dispose: () => void
}

const SEGMENT = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/

function repositoryName(owner: string, name: string): { owner: string, name: string } {
  const bare = name.replace(/\.git$/i, '')
  if (!SEGMENT.test(owner) || !SEGMENT.test(bare)) {
    throw new UsageError(`"${owner}/${name}" is not a valid GitHub repository name.`)
  }
  return { owner, name: bare }
}

function pullNumber(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new UsageError(`"${value}" is not a valid pull request number.`)
  }
  return Number(value)
}

/**
 * Parse a GitHub repository reference.
 *
 * Accepted spellings:
 * - `owner/repo`
 * - `https://github.com/owner/repo`, with or without `.git`
 * - `https://github.com/owner/repo/tree/<branch>` — everything after `tree/`
 *   is the branch, so branch names containing `/` survive
 * - `https://github.com/owner/repo/pull/<number>`
 * - `git@github.com:owner/repo.git`, fetched over SSH
 *
 * Only GitHub is supported: pull request heads are fetched from the base
 * repository's `refs/pull/<n>/head`, which is a GitHub convention.
 */
export function parseGithubRepository(value: string): GithubRepository {
  const input = value.trim()
  const invalid = () => new UsageError(
    `"${value}" is not a GitHub repository. Use owner/repo, a github.com URL, or git@github.com:owner/repo.`
  )

  const ssh = input.match(/^git@github\.com:([^/]+)\/([^/]+?)\/?$/)
  if (ssh) {
    const { owner, name } = repositoryName(ssh[1]!, ssh[2]!)
    return { owner, name, cloneUrl: `git@github.com:${owner}/${name}.git` }
  }

  const shorthand = input.match(/^([^/@:]+)\/([^/@:]+)$/)
  if (shorthand) {
    const { owner, name } = repositoryName(shorthand[1]!, shorthand[2]!)
    return { owner, name, cloneUrl: `https://github.com/${owner}/${name}.git` }
  }

  let url: URL
  try {
    url = new URL(/^[a-z]+:\/\//i.test(input) ? input : `https://${input}`)
  } catch {
    throw invalid()
  }
  if (url.hostname.toLowerCase() !== 'github.com' && url.hostname.toLowerCase() !== 'www.github.com') throw invalid()
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw invalid()
  if (url.username || url.password) throw invalid()

  const segments = url.pathname.split('/').filter(Boolean).map(segment => decodeURIComponent(segment))
  if (segments.length < 2) throw invalid()
  const { owner, name } = repositoryName(segments[0]!, segments[1]!)
  const repository: GithubRepository = { owner, name, cloneUrl: `https://github.com/${owner}/${name}.git` }
  const rest = segments.slice(2)
  if (rest.length === 0) return repository

  if (rest[0] === 'tree' && rest.length >= 2) {
    return { ...repository, ref: { kind: 'branch', name: rest.slice(1).join('/') } }
  }
  if (rest[0] === 'pull' && rest.length === 2) {
    return { ...repository, ref: { kind: 'pull', number: pullNumber(rest[1]!) } }
  }
  throw new UsageError(
    `"${value}" is not a repository, branch, or pull request URL. Use https://github.com/owner/repo, .../tree/<branch>, or .../pull/<number>.`
  )
}

export function describeGithubRef(ref: GithubRef | undefined): string {
  if (!ref) return 'default branch'
  return ref.kind === 'pull' ? `pull request #${ref.number}` : `branch ${ref.name}`
}

function refspec(ref: GithubRef | undefined): string {
  if (!ref) return 'HEAD'
  // The base repository advertises every pull request head, including heads
  // that live on forks, so a fork's content resolves without knowing the fork.
  return ref.kind === 'pull' ? `refs/pull/${ref.number}/head` : ref.name
}

/**
 * Fetch one revision into a temporary directory.
 *
 * A depth-one fetch of a single ref followed by a detached checkout: no history,
 * no tags, no other branches. Nothing from the repository runs — checkout does
 * not execute hooks, and BusinessLens never executes target code.
 */
export function fetchGithubSnapshot(repository: GithubRepository, ref: GithubRef | undefined): GithubSnapshot {
  // git reports real paths, and the temp dir is behind a symlink on macOS.
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'businesslens-view-')))
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    rmSync(root, { recursive: true, force: true })
  }
  try {
    git(root, 'init', '--quiet')
    git(root, 'remote', 'add', 'origin', repository.cloneUrl)
    try {
      git(root, 'fetch', '--quiet', '--depth', '1', '--no-tags', 'origin', refspec(ref))
    } catch (error) {
      throw new Error(
        `Could not fetch ${describeGithubRef(ref)} of ${repository.owner}/${repository.name}:\n${(error as Error).message}`
      )
    }
    git(root, 'checkout', '--quiet', '--detach', 'FETCH_HEAD')
    return { root, commit: git(root, 'rev-parse', 'HEAD'), dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
