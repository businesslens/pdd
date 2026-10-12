/** The port `pnpm dev` uses unless NUXT_PORT says otherwise. */
const DEFAULT_LOCAL_PORT = 3200

export interface TestServerEnvironment {
  appURL: string
  env: Record<string, string>
  port: number
}

/**
 * A test server isolated from the development server.
 *
 * The explicit override is useful in CI. Locally the offset keeps `pnpm test`
 * from colliding with `pnpm dev`.
 */
export function applyTestServerEnvironment(): TestServerEnvironment {
  delete process.env.NO_COLOR

  const port = resolveTestPort()
  const appURL = `http://127.0.0.1:${port}`
  const env: Record<string, string> = {
    ...definedEnvironmentVariables(),
    // Keep browser suites deterministic and prevent local PostHog credentials
    // from sending test traffic or opening the consent notice in unrelated UI
    // assertions. Analytics behavior is covered by isolated integration tests.
    NUXT_PUBLIC_POSTHOG_KEY: '',
    NUXT_PORT: String(port),
    PDD_KIT_TEST_PORT: String(port)
  }

  Object.assign(process.env, env)

  return { appURL, env, port }
}

export function resolveTestPort(environment: NodeJS.ProcessEnv = process.env): number {
  const explicitPort = environment.TEST_NUXT_PORT?.trim()
    || environment.PDD_KIT_TEST_PORT?.trim()
  const basePort = numberPort(environment.NUXT_PORT?.trim() || String(DEFAULT_LOCAL_PORT), 'NUXT_PORT')
  return explicitPort ? numberPort(explicitPort, 'TEST_NUXT_PORT') : numberPort(String(basePort + 1000), 'test port')
}

function numberPort(value: string, source: string): number {
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${source} must contain a valid TCP port, received ${value}.`)
  }
  return port
}

function definedEnvironmentVariables(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => (
      entry[0] !== 'NO_COLOR' && entry[1] !== undefined
    ))
  )
}
