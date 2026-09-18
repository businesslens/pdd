import { compileResolvedWorkspaceReport } from './export.js'
import {
  describeGithubRef,
  fetchGithubSnapshot,
  parseGithubRepository,
  type GithubRef,
  type GithubSnapshot
} from '../core/github-repository.js'
import { openBrowser, startLocalViewer } from '../core/local-viewer-server.js'
import { resolveModelRoot, type ModelRoot } from '../core/model-root.js'
import { UsageError } from '../core/usage-error.js'
import { join } from 'node:path'

export interface ViewOptions {
  port?: number
  open: boolean
  /** A GitHub repository to view instead of the working directory. */
  repository?: string
  /** Branch or tag of `repository`. */
  branch?: string
  /** Pull request of `repository` whose head is viewed. */
  pr?: number
  /** Whether `--cwd` was given; it selects a local model and has no remote meaning. */
  explicitCwd?: boolean
}

interface ViewSource {
  resolved: ModelRoot
  /** Present for a remote snapshot: the model changes only with a new fetch. */
  snapshot?: GithubSnapshot
  subject: string
}

function requestedRef(options: ViewOptions, embedded: GithubRef | undefined): GithubRef | undefined {
  const flags = [options.branch !== undefined && '--branch', options.pr !== undefined && '--pr'].filter(Boolean)
  if (flags.length > 1) throw new UsageError('Pass either --branch or --pr, not both.')
  if (embedded && flags.length) {
    throw new UsageError(`The repository URL already names a ${describeGithubRef(embedded)}; drop ${flags[0]}.`)
  }
  if (options.branch !== undefined) {
    const name = options.branch.trim()
    if (!name) throw new UsageError('--branch needs a branch or tag name.')
    return { kind: 'branch', name }
  }
  if (options.pr !== undefined) return { kind: 'pull', number: options.pr }
  return embedded
}

function resolveSource(cwd: string, options: ViewOptions): ViewSource {
  if (options.repository === undefined) {
    if (options.branch !== undefined || options.pr !== undefined) {
      throw new UsageError('--branch and --pr apply to a GitHub repository. Pass one: businesslens view owner/repo --pr 12')
    }
    return { resolved: resolveModelRoot(cwd), subject: 'the local Product Model' }
  }
  if (options.explicitCwd) {
    throw new UsageError('--cwd selects a local model. A GitHub repository is viewed from its own root.')
  }
  const repository = parseGithubRepository(options.repository)
  const ref = requestedRef(options, repository.ref)
  const name = `${repository.owner}/${repository.name}`
  console.log(`Fetching ${describeGithubRef(ref)} of ${name}…`)
  const snapshot = fetchGithubSnapshot(repository, ref)
  try {
    return {
      resolved: resolveModelRoot(snapshot.root),
      snapshot,
      subject: `${name} (${describeGithubRef(ref)}, commit ${snapshot.commit.slice(0, 7)})`
    }
  } catch (error) {
    snapshot.dispose()
    throw error
  }
}

export async function runView(cwd: string, options: ViewOptions): Promise<number> {
  let source: ViewSource | undefined
  try {
    // Fail before opening a socket, then watch the canonical model root. The
    // server compiles once per debounced source edit and streams revisions to
    // every open viewer. A remote snapshot cannot change, so it is not watched.
    source = resolveSource(cwd, options)
    const { resolved, snapshot } = source
    const initialReport = compileResolvedWorkspaceReport(resolved)
    const viewer = await startLocalViewer({
      port: options.port,
      initialReport,
      compile: () => compileResolvedWorkspaceReport(resolved),
      watchRoot: snapshot ? undefined : join(resolved.modelRoot, '.businesslens'),
      logoFile: join(resolved.modelRoot, '.businesslens', 'product', 'logo.svg'),
      // Reference targets resolve against the repository, not the model root —
      // the same base `lint` lists tracked files from — and implementation
      // captures legitimately live outside `.businesslens/`. A model outside a
      // repository has no repository-relative targets, so it gets no mount.
      assetRoot: resolved.gitRoot
    })
    console.log(`Viewing ${source.subject} at ${viewer.url}`)
    console.log('Press Ctrl+C to stop.')
    if (options.open) openBrowser(viewer.url)

    return await new Promise<number>((resolve) => {
      let closing = false
      const close = () => {
        if (closing) return
        closing = true
        void viewer.close().then(() => resolve(0), (error) => {
          console.error((error as Error).message)
          resolve(1)
        }).finally(() => snapshot?.dispose())
      }
      process.once('SIGINT', close)
      process.once('SIGTERM', close)
    })
  } catch (error) {
    source?.snapshot?.dispose()
    console.error((error as Error).message)
    return error instanceof UsageError ? 2 : 1
  }
}
