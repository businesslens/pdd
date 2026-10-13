import { existsSync, realpathSync } from 'node:fs'
import { CLI_NAME, PACKAGE_NAME, packageRoot } from '../version.js'
import { packageManagerFor } from './cli-update.js'

/** The command that runs the CLI without installing it. */
export const NPX_INVOCATION = `npx ${PACKAGE_NAME}`

/**
 * How a hint should tell the reader to run the CLI again.
 *
 * `pdd-kit` works only where it is on PATH; `npx pdd-toolkit` works everywhere
 * npm does, including inside a project that depends on the package. So the
 * bare command is used only where it is known to resolve: a global install a
 * package manager owns (the same test the update check uses), or a source
 * checkout outside any `node_modules`, which is a developer's link. Everything
 * else — an `npx`, `pnpm dlx` or `bunx` cache, a project dependency, a path
 * that cannot be resolved — gets `npx pdd-toolkit`. The path decides, never the
 * environment: `npm_*` variables leak into child processes and say nothing
 * about what is on PATH.
 */
export function invocationFor(
  root: string,
  platform: NodeJS.Platform = process.platform,
  exists: (path: string) => boolean = existsSync
): string {
  if (packageManagerFor(root, platform, exists)) return CLI_NAME
  return /[\\/]node_modules[\\/]/.test(`${root}/`) ? NPX_INVOCATION : CLI_NAME
}

let cached: string | undefined

/** The command prefix CLI hints print, such as `npx pdd-toolkit` in `npx pdd-toolkit lint`. */
export function cliInvocation(): string {
  if (cached) return cached
  try {
    cached = invocationFor(realpathSync(packageRoot()))
  } catch {
    cached = NPX_INVOCATION
  }
  return cached
}

/** A runnable command line for a hint: `cliCommand('lint')` is `pdd-kit lint` or `npx pdd-toolkit lint`. */
export function cliCommand(args: string): string {
  return `${cliInvocation()} ${args}`
}
