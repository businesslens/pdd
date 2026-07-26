import { isIP } from 'node:net'

export const DEFAULT_PLATFORM_URL = 'https://app.businesslens.io'

function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[(.*)\]$/, '$1')
  if (host === 'localhost' || host === '::1') return true
  if (isIP(host) === 4) return host.split('.')[0] === '127'
  return false
}

/**
 * API keys may be sent only to the official platform or to a literal
 * loopback host used for local development.
 */
export function trustedPlatformUrl(value: string): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(
      'platform.url must be https://app.businesslens.io or a loopback development URL.'
    )
  }

  if (
    url.username
    || url.password
    || url.pathname !== '/'
    || url.search
    || url.hash
  ) {
    throw new Error(
      'platform.url must be an origin without credentials, a path, a query string, or a fragment.'
    )
  }

  if (url.origin === DEFAULT_PLATFORM_URL) return url.origin
  if (
    isLoopbackHostname(url.hostname)
    && (url.protocol === 'http:' || url.protocol === 'https:')
  ) {
    return url.origin
  }

  throw new Error(
    'Refusing to send BUSINESSLENS_API_KEY to an untrusted platform.url. '
    + `Use ${DEFAULT_PLATFORM_URL} or a loopback development host (localhost, 127.x.x.x, or ::1).`
  )
}
