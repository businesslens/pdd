import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

let cached: string | undefined

/** Package version, resolved from package.json next to the compiled bundle or the source tree. */
export function cliVersion(): string {
  if (cached) return cached
  const here = dirname(fileURLToPath(import.meta.url))
  for (const candidate of [join(here, '../package.json'), join(here, '../../package.json')]) {
    try {
      const parsed = JSON.parse(readFileSync(candidate, 'utf8')) as { name?: string, version?: string }
      if (parsed.name === 'businesslens' && parsed.version) {
        cached = parsed.version
        return cached
      }
    } catch {
      // try the next candidate
    }
  }
  cached = '0.0.0'
  return cached
}
