import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * The npm package. npm refuses the bare name `pdd-kit` as too close to `pdfkit`,
 * so the package is scoped; the command it installs is still `pdd-kit`.
 */
export const PACKAGE_NAME = '@itai-gendler/pdd-kit'

/** The command the package installs. */
export const CLI_NAME = 'pdd-kit'

let cached: { root: string, version: string } | undefined

function resolvePackage(): { root: string, version: string } {
  if (cached) return cached
  const here = dirname(fileURLToPath(import.meta.url))
  for (const root of [join(here, '..'), join(here, '../..')]) {
    try {
      const parsed = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name?: string, version?: string }
      if (parsed.name === PACKAGE_NAME && parsed.version) {
        cached = { root, version: parsed.version }
        return cached
      }
    } catch {
      // try the next candidate
    }
  }
  cached = { root: join(here, '..'), version: '0.0.0' }
  return cached
}

/** Package version, resolved from package.json next to the compiled bundle or the source tree. */
export function cliVersion(): string {
  return resolvePackage().version
}

/** Directory holding the running package's package.json. */
export function packageRoot(): string {
  return resolvePackage().root
}
