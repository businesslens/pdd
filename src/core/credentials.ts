import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { trustedPlatformUrl } from './platform-url.js'

export interface CliCredentials {
  schema: 1
  platformUrl: string
  accessToken: string
  expiresAt: string
}

function configRoot(explicit?: string): string {
  if (explicit) return resolve(explicit)
  const configured = process.env.BUSINESSLENS_CONFIG_DIR?.trim()
  if (configured) return isAbsolute(configured) ? configured : resolve(configured)
  const xdg = process.env.XDG_CONFIG_HOME?.trim()
  return join(xdg ? resolve(xdg) : join(homedir(), '.config'), 'businesslens')
}

export function credentialsFile(configDir?: string): string {
  return join(configRoot(configDir), 'credentials.json')
}

function assertRegularCredentialFile(file: string): void {
  if (!existsSync(file)) return
  const stat = lstatSync(file)
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`Refusing to use non-regular CLI credentials at ${file}.`)
  }
}

export function writeCredentials(credentials: CliCredentials, configDir?: string): string {
  const file = credentialsFile(configDir)
  const directory = dirname(file)
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  chmodSync(directory, 0o700)
  assertRegularCredentialFile(file)

  const temporary = join(directory, `.credentials.${randomUUID()}.tmp`)
  try {
    writeFileSync(temporary, `${JSON.stringify(credentials, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600
    })
    chmodSync(temporary, 0o600)
    renameSync(temporary, file)
    chmodSync(file, 0o600)
  } finally {
    rmSync(temporary, { force: true })
  }
  return file
}

export function readCredentials(configDir?: string, now = Date.now()): CliCredentials {
  const file = credentialsFile(configDir)
  assertRegularCredentialFile(file)
  if (!existsSync(file)) {
    throw new Error('BusinessLens CLI is not logged in. Run `businesslens login` first.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    throw new Error('BusinessLens CLI credentials are invalid. Run `businesslens login` again.')
  }
  const value = parsed as Partial<CliCredentials>
  if (
    value.schema !== 1
    || typeof value.platformUrl !== 'string'
    || typeof value.accessToken !== 'string'
    || !value.accessToken
    || typeof value.expiresAt !== 'string'
    || Number.isNaN(Date.parse(value.expiresAt))
  ) {
    throw new Error('BusinessLens CLI credentials are invalid. Run `businesslens login` again.')
  }

  const platformUrl = trustedPlatformUrl(value.platformUrl)
  if (Date.parse(value.expiresAt) <= now) {
    throw new Error('BusinessLens CLI login has expired. Run `businesslens login` again.')
  }
  return {
    schema: 1,
    platformUrl,
    accessToken: value.accessToken,
    expiresAt: value.expiresAt
  }
}
