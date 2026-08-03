import { isIP } from 'node:net'
import { UsageError } from './usage-error.js'

export const DEFAULT_CATALOG_URL = 'https://businesslens.io'

function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[(.*)\]$/, '$1')
  if (host === 'localhost' || host === '::1') return true
  if (isIP(host) === 4) return host.split('.')[0] === '127'
  return false
}

/**
 * Validate a catalog origin.
 *
 * The **shape** is still checked — no credentials, path, query, or fragment,
 * and https except on loopback — because a malformed origin is a bug worth
 * catching and a plaintext one is worth refusing.
 *
 * The origin **allowlist is deliberately gone.** It existed to protect
 * `BUSINESSLENS_API_KEY`, which the read path no longer sends: pulling is
 * anonymous, so there is no secret to leak to a host of the caller's choosing,
 * and anyone may run their own catalog. The publish script, which does carry a
 * credential, keeps an allowlist of its own.
 */
export function trustedCatalogUrl(value: string): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new UsageError(`"${value}" is not a valid catalog origin.`)
  }

  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new UsageError(
      'The catalog origin must be a bare origin, with no credentials, path, query string, or fragment.'
    )
  }

  if (url.protocol === 'https:') return url.origin
  if (url.protocol === 'http:' && isLoopbackHostname(url.hostname)) return url.origin

  throw new UsageError(
    'The catalog origin must use https, except on a loopback development host (localhost, 127.x.x.x, or ::1).'
  )
}

/**
 * Resolve which catalog to pull from.
 *
 * Precedence: an explicit `--catalog` flag, then `BUSINESSLENS_CATALOG_URL`,
 * then the public catalog.
 */
export function resolveCatalogUrl(
  flag: string | undefined,
  env: NodeJS.ProcessEnv = process.env
): string {
  return trustedCatalogUrl(flag ?? env.BUSINESSLENS_CATALOG_URL ?? DEFAULT_CATALOG_URL)
}
