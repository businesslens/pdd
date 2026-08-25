import { compileResolvedWorkspaceReport } from './export.js'
import { openBrowser, startLocalViewer } from '../core/local-viewer-server.js'
import { resolveModelRoot } from '../core/model-root.js'
import { join } from 'node:path'

export interface ViewOptions {
  port?: number
  open: boolean
}

export async function runView(cwd: string, options: ViewOptions): Promise<number> {
  try {
    // Fail before opening a socket, then watch the canonical model root. The
    // server compiles once per debounced source edit and streams revisions to
    // every open viewer.
    const resolved = resolveModelRoot(cwd)
    const initialReport = compileResolvedWorkspaceReport(resolved)
    const viewer = await startLocalViewer({
      port: options.port,
      initialReport,
      compile: () => compileResolvedWorkspaceReport(resolved),
      watchRoot: join(resolved.modelRoot, '.businesslens'),
      logoFile: join(resolved.modelRoot, '.businesslens', 'product', 'logo.svg'),
      // Reference targets resolve against the repository, not the model root —
      // the same base `lint` lists tracked files from — and implementation
      // captures legitimately live outside `.businesslens/`. A model outside a
      // repository has no repository-relative targets, so it gets no mount.
      assetRoot: resolved.gitRoot
    })
    console.log(`Viewing the local Product Model at ${viewer.url}`)
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
