import { spawnSync } from 'node:child_process'
import { writeCredentials } from '../core/credentials.js'
import { trustedPlatformUrl } from '../core/platform-url.js'

const DEVICE_CLIENT_ID = 'businesslens-cli'
const DEVICE_SCOPE = 'blueprints:read'
const DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code'

export interface LoginOptions {
  platform?: string
}

export interface LoginDependencies {
  fetch: typeof globalThis.fetch
  openBrowser: (url: string) => boolean
  wait: (milliseconds: number) => Promise<void>
  now: () => number
  configDir?: string
}

function defaultOpenBrowser(url: string): boolean {
  const command = process.platform === 'darwin'
    ? ['open', [url]] as const
    : process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]] as const
      : ['xdg-open', [url]] as const
  const result = spawnSync(command[0], command[1], { stdio: 'ignore' })
  return !result.error && result.status === 0
}

function defaultWait(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function json(response: Response): Promise<Record<string, unknown>> {
  try {
    return await response.json() as Record<string, unknown>
  } catch {
    return {}
  }
}

function errorMessage(payload: Record<string, unknown>, fallback: string): string {
  return typeof payload.error_description === 'string'
    ? payload.error_description
    : typeof payload.message === 'string'
      ? payload.message
      : fallback
}

export async function runLogin(
  options: LoginOptions,
  dependencies: Partial<LoginDependencies> = {}
): Promise<number> {
  const fetcher = dependencies.fetch ?? globalThis.fetch
  const openBrowser = dependencies.openBrowser ?? defaultOpenBrowser
  const wait = dependencies.wait ?? defaultWait
  const now = dependencies.now ?? Date.now

  let baseUrl: string
  try {
    baseUrl = trustedPlatformUrl(options.platform ?? 'https://app.businesslens.io')
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }

  let authorization: Record<string, unknown>
  try {
    const response = await fetcher(`${baseUrl}/api/auth/device/code`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        client_id: DEVICE_CLIENT_ID,
        scope: DEVICE_SCOPE
      }),
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000)
    })
    authorization = await json(response)
    if (!response.ok) {
      throw new Error(errorMessage(authorization, `Login request failed with status ${response.status}.`))
    }
  } catch (error) {
    console.error(`Could not start BusinessLens login: ${(error as Error).message}`)
    return 1
  }

  const deviceCode = authorization.device_code
  const userCode = authorization.user_code
  const verificationComplete = authorization.verification_uri_complete
  const verification = authorization.verification_uri
  const expiresIn = Number(authorization.expires_in)
  let interval = Math.max(1, Number(authorization.interval) || 5)
  if (
    typeof deviceCode !== 'string'
    || !deviceCode
    || typeof userCode !== 'string'
    || !userCode
    || (!verificationComplete && !verification)
    || !Number.isFinite(expiresIn)
    || expiresIn <= 0
  ) {
    console.error('Could not start BusinessLens login: the Platform returned an invalid device authorization.')
    return 1
  }

  let verificationUrl: URL
  try {
    verificationUrl = new URL(String(verificationComplete || verification), baseUrl)
    if (verificationUrl.origin !== baseUrl) {
      throw new Error('verification URL uses a different origin')
    }
  } catch (error) {
    console.error(`Could not start BusinessLens login: ${(error as Error).message}.`)
    return 1
  }

  console.log(`Authorize BusinessLens CLI at ${verificationUrl.toString()}`)
  console.log(`Code: ${userCode}`)
  if (!openBrowser(verificationUrl.toString())) {
    console.log('The browser could not be opened automatically. Open the URL above to continue.')
  }

  const deadline = now() + (expiresIn * 1000)
  while (now() < deadline) {
    await wait(interval * 1000)
    let response: Response
    let payload: Record<string, unknown>
    try {
      response = await fetcher(`${baseUrl}/api/auth/device/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          grant_type: DEVICE_GRANT,
          device_code: deviceCode,
          client_id: DEVICE_CLIENT_ID
        }),
        redirect: 'manual',
        signal: AbortSignal.timeout(15_000)
      })
      payload = await json(response)
    } catch (error) {
      console.error(`BusinessLens login failed: ${(error as Error).message}`)
      return 1
    }

    if (response.ok) {
      const accessToken = payload.access_token
      const tokenExpiresIn = Number(payload.expires_in)
      if (
        typeof accessToken !== 'string'
        || !accessToken
        || !Number.isFinite(tokenExpiresIn)
        || tokenExpiresIn <= 0
      ) {
        console.error('BusinessLens login failed: the Platform returned an invalid CLI session.')
        return 1
      }
      try {
        writeCredentials({
          schema: 1,
          platformUrl: baseUrl,
          accessToken,
          expiresAt: new Date(now() + (tokenExpiresIn * 1000)).toISOString()
        }, dependencies.configDir)
      } catch (error) {
        console.error(`BusinessLens login succeeded, but credentials could not be stored: ${(error as Error).message}`)
        return 1
      }
      console.log('Logged in to BusinessLens. You can now pull Hub Blueprints.')
      return 0
    }

    const code = payload.error
    if (code === 'authorization_pending') continue
    if (code === 'slow_down') {
      interval += 5
      continue
    }
    console.error(`BusinessLens login failed: ${errorMessage(payload, `status ${response.status}`)}`)
    return 1
  }

  console.error('BusinessLens login expired before authorization completed. Run `businesslens login` again.')
  return 1
}
