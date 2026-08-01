import { realpathSync } from 'node:fs'
import { relative } from 'node:path'
import { git, repoRoot } from './git.js'

/**
 * Which of the two things that can change has changed, since you branched.
 *
 * A Product Model has exactly two moving parts — the model and the code — so
 * "where do I stand" has four answers. `businesslens-sync` reads this on entry
 * so the user never has to work out whether they planned first: the answer is
 * derived from git, not remembered.
 *
 * Deliberately separate from `validateModel`, which is a pure function of the
 * authored files. Whether the model is *sound* and where you *stand* are
 * different questions, and only the first one belongs in an exit code.
 */
export type Situation =
  | 'at-rest'
  | 'planned'
  | 'implemented'
  | 'unplanned-code'

export interface BranchState {
  base: string
  branch: string
  modelFiles: number
  codeFiles: number
  situation: Situation
}

function situationOf(modelFiles: number, codeFiles: number): Situation {
  if (modelFiles === 0) return codeFiles === 0 ? 'at-rest' : 'unplanned-code'
  return codeFiles === 0 ? 'planned' : 'implemented'
}

function firstResolvable(root: string, candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    try {
      git(root, 'rev-parse', '--verify', '--quiet', `${candidate}^{commit}`)
      return candidate
    } catch {
      // Try the next candidate.
    }
  }
  return undefined
}

function defaultBranch(root: string): string | undefined {
  const candidates: string[] = []
  try {
    candidates.push(git(root, 'symbolic-ref', '--short', 'refs/remotes/origin/HEAD'))
  } catch {
    // No origin, or no default recorded for it. The names below still apply.
  }
  candidates.push('origin/main', 'origin/master', 'main', 'master')
  return firstResolvable(root, candidates)
}

const posix = (path: string) => path.split('\\').join('/')

/**
 * Undefined whenever the answer cannot be trusted: no repository, a shallow
 * clone with no merge base (`actions/checkout` defaults to depth 1), or a
 * repository with no commits yet. Reporting nothing beats guessing, because the
 * whole value here is that the answer is mechanical rather than inferred.
 */
export function branchState(cwd: string, modelDirectory: string): BranchState | undefined {
  try {
    const root = repoRoot(cwd)
    const base = defaultBranch(root)
    if (!base) return undefined

    const branch = git(root, 'rev-parse', '--abbrev-ref', 'HEAD')
    const mergeBase = git(root, 'merge-base', 'HEAD', base)

    // Working tree against the merge base, not HEAD against it: someone
    // half-way through a change has not committed yet, and telling them nothing
    // has moved would be worse than useless.
    const changed = git(root, 'diff', '--name-only', mergeBase).split('\n').filter(Boolean)
    const untracked = git(root, 'ls-files', '--others', '--exclude-standard', '-z')
      .split('\0')
      .filter(Boolean)

    // Through realpath first. `git rev-parse --show-toplevel` resolves symlinks
    // and the caller's path may not — on macOS a repository under /var reports
    // as /private/var — which would leave every model file looking like code.
    const prefix = `${posix(relative(realpathSync(root), realpathSync(modelDirectory)))}/`
    const paths = [...new Set([...changed, ...untracked].map(posix))]
    const modelFiles = paths.filter(path => path.startsWith(prefix)).length

    const codeFiles = paths.length - modelFiles
    return { base, branch, modelFiles, codeFiles, situation: situationOf(modelFiles, codeFiles) }
  } catch {
    return undefined
  }
}

/**
 * The four rows of the flow table, in the order the reader needs them: what
 * moved, then what to do about it.
 *
 * Everything outside the model counts as code, because nothing here can tell a
 * behavior change from a README edit. So the code-changed line asks rather than
 * asserts — claiming drift that did not happen would train people to ignore it.
 */
const ADVICE: Record<Situation, string[]> = {
  'at-rest': [
    'Nothing has moved since you branched.'
  ],
  planned: [
    'You have described a change nobody has written yet. Build it, then run',
    '/businesslens-sync to attach the evidence.'
  ],
  implemented: [
    'You described a change and wrote code for it, but nothing has checked that',
    'the code matches. /businesslens-sync checks every planned addition, change,',
    'and removal against the code, and attaches evidence.'
  ],
  'unplanned-code': [
    'The model is unchanged while the code moved. If any of that altered what the',
    'product does, the model still describes the old behavior — /businesslens-sync',
    'works out what changed and brings it up to date.'
  ]
}

export function describeBranchState(state: BranchState): string[] {
  const { modelFiles, codeFiles } = state
  return [
    `On ${state.branch}, against ${state.base}:`,
    `  model  ${modelFiles === 0 ? 'unchanged' : `${modelFiles} file(s) changed`}`,
    `  code   ${codeFiles === 0 ? 'unchanged' : `${codeFiles} file(s) changed`}`,
    '',
    ...ADVICE[state.situation]
  ]
}
