import { execFile } from 'node:child_process'

/** The one repository the local report can star. It is fixed, never a request parameter. */
export const BUSINESSLENS_REPOSITORY = 'businesslens/pdd'

/** `unavailable`: no `gh`, signed out, or GitHub unreachable. The report then shows only the link. */
export type GithubStarState = 'starred' | 'not-starred' | 'unavailable'

export interface GithubStarClient {
  state: () => Promise<GithubStarState>
  /** Resolves once GitHub has accepted the star; rejects otherwise. */
  star: () => Promise<void>
  /** Resolves once GitHub has removed the star; rejects otherwise. */
  unstar: () => Promise<void>
}

const GH_TIMEOUT_MS = 10_000
const STARRED_PATH = `/user/starred/${BUSINESSLENS_REPOSITORY}`

interface GhResult { ok: boolean, notFound: boolean }

/**
 * Run `gh api` against github.com, whatever host `gh` defaults to.
 *
 * The user's own `gh` sign-in does the work; BusinessLens never reads, stores
 * or sends the token.
 */
function gh(args: string[]): Promise<GhResult> {
  return new Promise((resolve) => {
    execFile('gh', ['api', '--hostname', 'github.com', ...args], {
      timeout: GH_TIMEOUT_MS,
      env: { ...process.env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1' }
    }, (error, _stdout, stderr) => {
      resolve({ ok: !error, notFound: Boolean(error) && /\(HTTP 404\)/.test(String(stderr)) })
    })
  })
}

export const ghStarClient: GithubStarClient = {
  async state() {
    const result = await gh([STARRED_PATH])
    if (result.ok) return 'starred'
    return result.notFound ? 'not-starred' : 'unavailable'
  },
  async star() {
    const result = await gh(['--method', 'PUT', STARRED_PATH])
    if (!result.ok) throw new Error('GitHub did not accept the star.')
  },
  async unstar() {
    const result = await gh(['--method', 'DELETE', STARRED_PATH])
    if (!result.ok) throw new Error('GitHub did not remove the star.')
  }
}
