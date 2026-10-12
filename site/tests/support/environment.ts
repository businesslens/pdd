/**
 * The port the generated site is served on for the browser suites. It is clear
 * of `pnpm dev`, which Nuxt starts on 3000, so a dev server can keep running.
 */
const DEFAULT_TEST_PORT = 4200

export interface TestServerEnvironment {
  appURL: string
  env: Record<string, string>
  port: number
}

/**
 * A test server isolated from the development server.
 *
 * `TEST_NUXT_PORT` overrides the port when 4200 is taken.
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
    NUXT_PUBLIC_POSTHOG_KEY: ''
  }

  Object.assign(process.env, env)

  return { appURL, env, port }
}

export function resolveTestPort(environment: NodeJS.ProcessEnv = process.env): number {
  const explicitPort = environment.TEST_NUXT_PORT?.trim()
  return explicitPort ? numberPort(explicitPort, 'TEST_NUXT_PORT') : DEFAULT_TEST_PORT
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
