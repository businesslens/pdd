import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

let cached: { root: string, version: string } | undefined

function resolvePackage(): { root: string, version: string } {
  if (cached) return cached
  const here = dirname(fileURLToPath(import.meta.url))
  for (const root of [join(here, '..'), join(here, '../..')]) {
    try {
      const parsed = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name?: string, version?: string }
      if (parsed.name === 'businesslens' && parsed.version) {
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
