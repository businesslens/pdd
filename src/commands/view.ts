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
      logoFile: join(resolved.modelRoot, '.businesslens', 'logo.svg')
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
