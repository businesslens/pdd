import { compileResolvedWorkspaceReport } from './export.js'
import { repoRoot } from '../core/git.js'
import { openBrowser, startLocalViewer, type LocalViewerBinding } from '../core/local-viewer-server.js'
import { resolveModelRoot, type ModelRoot } from '../core/model-root.js'

import {
  describeGithubRef,
  fetchGithubSnapshot,
  parseGithubRepository,
  type GithubRef,
  type GithubSnapshot
} from '../core/github-repository.js'
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
  resolved?: ModelRoot
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
    let resolved: ModelRoot | undefined
    try { resolved = resolveModelRoot(cwd) } catch { /* Wait for local model creation. */ }
    return { resolved, subject: 'the local Product Model' }
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

/** How often a viewer with no model yet looks for one. Cheap: two `existsSync` calls. */
const LOCATE_INTERVAL_MS = 500

/** Everything the server needs to serve one resolved model. */
function bindingFor(resolved: ModelRoot): LocalViewerBinding {
  return {
    compile: () => compileResolvedWorkspaceReport(resolved),
    watchRoot: join(resolved.modelRoot, '.businesslens'),
    logoFile: join(resolved.modelRoot, '.businesslens', 'product', 'logo.svg'),
    // Reference targets resolve against the repository, not the model root —
    // the same base `lint` lists tracked files from — and implementation
    // captures legitimately live outside `.businesslens/`. A model outside a
    // repository has no repository-relative targets, so it gets no mount.
    assetRoot: resolved.gitRoot
  }
}

/**
 * Open the local report and keep it open.
 *
 * The report is a place to watch a model being built, so the viewer starts
 * whatever state the model is in. No `.businesslens/` yet: it serves a waiting
 * message and binds the model the moment the directory appears. A model that
 * does not lint: it serves the errors and comes alive on the first clean save.
 * Only a port that cannot be opened stops it.
 */
export async function runView(cwd: string, options: ViewOptions): Promise<number> {
  let source: ViewSource | undefined
  try {
    source = resolveSource(cwd, options)
    const { resolved, snapshot } = source
    const initialReport = snapshot && resolved ? compileResolvedWorkspaceReport(resolved) : undefined
    const locate = (): ModelRoot | undefined => {
      try {
        return resolveModelRoot(cwd)
      } catch {
        return undefined
      }
    }
    let gitRoot: string | undefined
    try {
      gitRoot = repoRoot(cwd)
    } catch {
      gitRoot = undefined
    }
    const expected = [...new Set([cwd, gitRoot].filter((item): item is string => Boolean(item)))]
      .map(directory => join(directory, '.businesslens'))
    const viewer = await startLocalViewer({
      port: options.port,
      initialReport,
      waitingMessage: `No Product Model yet. The report will appear when ${expected.join(' or ')} is created — use businesslens-map for established code or businesslens-ideate for a new product.`,
      ...(resolved ? { ...bindingFor(resolved), ...(snapshot ? { watchRoot: undefined } : {}) } : {})
    })
    console.log(`Viewing ${source.subject} at ${viewer.url}`)
    if (!resolved) {
      console.log(`No Product Model yet. Waiting for ${expected.join(' or ')} to be created.`)
    } else if (!viewer.status().ready) {
      console.log('The Product Model does not compile yet; the report shows why and updates on the first clean save.')
    }
    console.log('Press Ctrl+C to stop.')
    if (options.open) openBrowser(viewer.url)

    let locating: ReturnType<typeof setInterval> | undefined
    if (!resolved) {
      locating = setInterval(() => {
        const found = locate()
        if (!found) return
        clearInterval(locating)
        locating = undefined
        viewer.bind(bindingFor(found))
        console.log(`Found the Product Model at ${join(found.modelRoot, '.businesslens')}.`)
      }, LOCATE_INTERVAL_MS)
    }

    return await new Promise<number>((resolve) => {
      let closing = false
      const close = () => {
        if (closing) return
        closing = true
        if (locating) clearInterval(locating)
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
