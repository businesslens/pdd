import { compileResolvedWorkspaceReport } from './export.js'
import { createCommittedReportSource, ensureCheckpointsDirectory, writeCheckpoint } from '../core/checkpoints.js'
import { createGitHistory } from '../core/git-history.js'
import { repoRoot } from '../core/git.js'
import { openBrowser, startLocalViewer, type LocalViewerBinding } from '../core/local-viewer-server.js'
import { resolveModelRoot, type ModelRoot } from '../core/model-root.js'
import { join } from 'node:path'

export interface ViewOptions {
  port?: number
  open: boolean
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
    assetRoot: resolved.gitRoot,
    referenceRoot: resolved.gitRoot ?? resolved.modelRoot,
    // History: read checkpoints from the generated cache and check
    // HEAD periodically so committing also updates an open comparison.
    checkpointsRoot: ensureCheckpointsDirectory(resolved.modelRoot),
    committed: createCommittedReportSource(resolved),
    history: createGitHistory(resolved),
    pin: (report, label) => writeCheckpoint(resolved.modelRoot, report, { source: 'checkpoint', label, referenceRoot: resolved.gitRoot ?? resolved.modelRoot })
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
  try {
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
    const resolved = locate()
    const viewer = await startLocalViewer({
      port: options.port,
      waitingMessage: `No Product Model yet. The report will appear when ${expected.join(' or ')} is created — use businesslens-map for established code or businesslens-ideate for a new product.`,
      ...(resolved ? bindingFor(resolved) : {})
    })
    console.log(`Viewing the local Product Model at ${viewer.url}`)
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
        })
      }
      process.once('SIGINT', close)
      process.once('SIGTERM', close)
    })
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
}
