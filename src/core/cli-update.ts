import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cancel, isCancel, select } from '@clack/prompts'
import { cliVersion, packageRoot } from '../version.js'

/**
 * The CLI's own update prompt.
 *
 * This is about the `businesslens` package, never the skills `update` manages.
 * A command reads what an earlier background check found and asks at most once
 * per available version; the registry request itself runs in a detached
 * process, so no command waits on the network. Nothing is checked or asked in
 * CI, without a terminal, or where the CLI cannot update itself: an `npx` run
 * already resolves the latest release, and a project dependency's version
 * belongs to that project's lockfile.
 */

const PACKAGE = 'businesslens'
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000
const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/
const CI_VARIABLES = [
  'CI',
  'CONTINUOUS_INTEGRATION',
  'BUILD_NUMBER',
  'RUN_ID',
  'GITHUB_ACTIONS',
  'GITLAB_CI',
  'BUILDKITE',
  'TF_BUILD',
  'JENKINS_URL',
  'TEAMCITY_VERSION',
  'CODEBUILD_BUILD_ID'
]

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

export interface InstallCommand {
  command: string
  args: string[]
}

export interface UpdateState {
  latestVersion?: string
  checkedAt?: string
  promptedVersion?: string
  disabled?: boolean
}

export type UpdateChoice = 'update' | 'later' | 'never' | 'cancel'

export interface UpdateCheckOptions {
  env: NodeJS.ProcessEnv
  interactive: boolean
  currentVersion: string
  statePath: string
  now: () => Date
  /** The package manager that owns this installation, if it can update it. */
  packageManager: () => PackageManager | undefined
  /** Starts the detached registry check. */
  startRefresh: () => void
  choose: (current: string, latest: string, install: InstallCommand) => Promise<UpdateChoice>
  runInstall: (install: InstallCommand) => boolean
  log: (message: string) => void
  error: (message: string) => void
}

function parse(version: string): [number, number, number, string | undefined] | undefined {
  const match = SEMVER.exec(version)
  if (!match) return undefined
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4]]
}

/** Whether `candidate` is a stable release later than `current`. */
export function isNewerStable(candidate: string, current: string): boolean {
  const next = parse(candidate)
  const installed = parse(current)
  if (!next || !installed || next[3] !== undefined) return false
  for (let index = 0; index < 3; index += 1) {
    if (next[index]! !== installed[index]!) return next[index]! > installed[index]!
  }
  // The same release: newer only than its own prereleases.
  return installed[3] !== undefined
}

function enabled(value: string | undefined): boolean {
  if (value === undefined) return false
  const normalized = value.trim().toLowerCase()
  return normalized !== '' && normalized !== '0' && normalized !== 'false'
}

/** Whether the environment turns the update check off: CI, or `BUSINESSLENS_NO_UPDATE_CHECK`. */
export function updateCheckSuppressed(env: NodeJS.ProcessEnv): boolean {
  return enabled(env.BUSINESSLENS_NO_UPDATE_CHECK) || CI_VARIABLES.some(name => enabled(env[name]))
}

/** Where the update check keeps its state, including "Do not remind me again". */
export function updateStatePath(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  home: string = homedir()
): string {
  const configHome = env.XDG_CONFIG_HOME?.trim()
    || (platform === 'win32' ? env.APPDATA?.trim() || join(home, 'AppData', 'Roaming') : join(home, '.config'))
  return join(configHome, 'businesslens', 'update-check.json')
}

export function readUpdateState(path: string): UpdateState {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as UpdateState : {}
  } catch {
    return {}
  }
}

/** Merges `patch` into the state file. A state that cannot be written is not an error. */
export function writeUpdateState(path: string, patch: UpdateState): void {
  try {
    mkdirSync(dirname(path), { recursive: true })
    const temporary = `${path}.${process.pid}.tmp`
    writeFileSync(temporary, `${JSON.stringify({ ...readUpdateState(path), ...patch }, null, 2)}\n`)
    renameSync(temporary, path)
  } catch {
    // Read-only home directories still run every command.
  }
}

/**
 * The package manager whose global installation holds `root`, the real path of
 * the running package. Anything else (an `npx` cache, a project dependency, a
 * source checkout or link) cannot be updated from here.
 */
export function packageManagerFor(
  root: string,
  platform: NodeJS.Platform = process.platform,
  exists: (path: string) => boolean = existsSync
): PackageManager | undefined {
  const path = root.replace(/\\/g, '/')
  if (basename(path) !== PACKAGE || path.includes('/_npx/')) return undefined
  if (/\/pnpm\/global\//i.test(path)) return 'pnpm'
  if (/\/\.bun\/install\/global\/node_modules\//i.test(path)) return 'bun'
  if (/\/yarn\/(?:data\/)?global\/node_modules\//i.test(path)) return 'yarn'

  // npm installs globally to <prefix>/lib/node_modules with its bin in
  // <prefix>/bin, or to <prefix>/node_modules beside <prefix>/businesslens.cmd
  // on Windows. Matching that shape covers a configured prefix as well.
  const modules = dirname(path)
  if (basename(modules) !== 'node_modules') return undefined
  if (platform === 'win32') {
    return exists(join(dirname(modules), `${PACKAGE}.cmd`)) ? 'npm' : undefined
  }
  const lib = dirname(modules)
  if (basename(lib) !== 'lib') return undefined
  return exists(join(dirname(lib), 'bin', PACKAGE)) ? 'npm' : undefined
}

export function installCommand(manager: PackageManager, version: string): InstallCommand {
  const spec = `${PACKAGE}@${version}`
  switch (manager) {
    case 'npm': return { command: 'npm', args: ['install', '--global', spec] }
    case 'pnpm': return { command: 'pnpm', args: ['add', '--global', spec] }
    case 'yarn': return { command: 'yarn', args: ['global', 'add', spec] }
    case 'bun': return { command: 'bun', args: ['add', '--global', spec] }
  }
}

export function formatCommand(install: InstallCommand): string {
  return [install.command, ...install.args].join(' ')
}

function registry(env: NodeJS.ProcessEnv): string {
  const configured = (env.npm_config_registry || env.NPM_CONFIG_REGISTRY)?.trim()
  return (configured || 'https://registry.npmjs.org').replace(/\/+$/, '')
}

/** The registry's `latest` release, if it is a stable version. */
export async function fetchLatestVersion(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch
): Promise<string | undefined> {
  try {
    const response = await fetchImpl(`${registry(env)}/-/package/${PACKAGE}/dist-tags`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(10_000)
    })
    if (!response.ok) return undefined
    const { latest } = await response.json() as { latest?: unknown }
    return typeof latest === 'string' && parse(latest)?.[3] === undefined ? latest : undefined
  } catch {
    return undefined
  }
}

/** The detached check: records the latest release for a later command to offer. */
export async function refreshLatestVersion(
  statePath: string = updateStatePath(),
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
  now: () => Date = () => new Date()
): Promise<void> {
  const latestVersion = await fetchLatestVersion(env, fetchImpl)
  if (latestVersion) writeUpdateState(statePath, { latestVersion, checkedAt: now().toISOString() })
}

function due(checkedAt: string | undefined, now: Date): boolean {
  const last = checkedAt ? Date.parse(checkedAt) : Number.NaN
  return Number.isNaN(last) || last > now.getTime() || now.getTime() - last >= CHECK_INTERVAL_MS
}

function startDetachedRefresh(): void {
  const worker = join(dirname(fileURLToPath(import.meta.url)), 'update-check.js')
  try {
    spawn(process.execPath, [worker], { detached: true, stdio: 'ignore', windowsHide: true })
      .on('error', () => {})
      .unref()
  } catch {
    // The next command tries again.
  }
}

async function chooseInPrompt(current: string, latest: string, install: InstallCommand): Promise<UpdateChoice> {
  const choice = await select<UpdateChoice>({
    message: `A newer BusinessLens CLI is available: ${current} → ${latest}`,
    options: [
      { value: 'update', label: 'Update now', hint: formatCommand(install) },
      { value: 'later', label: 'Not now' },
      { value: 'never', label: 'Do not remind me again' }
    ]
  })
  if (isCancel(choice)) {
    cancel('Cancelled.')
    return 'cancel'
  }
  return choice
}

function runInstallCommand(install: InstallCommand): boolean {
  const result = spawnSync(install.command, install.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  return result.status === 0
}

function defaults(): UpdateCheckOptions {
  return {
    env: process.env,
    interactive: Boolean(process.stdin.isTTY && process.stdout.isTTY),
    currentVersion: cliVersion(),
    statePath: updateStatePath(),
    now: () => new Date(),
    packageManager: () => {
      try {
        return packageManagerFor(realpathSync(packageRoot()))
      } catch {
        return undefined
      }
    },
    startRefresh: startDetachedRefresh,
    choose: chooseInPrompt,
    runInstall: runInstallCommand,
    log: message => console.log(message),
    error: message => console.error(message)
  }
}

/**
 * Offers a newer CLI before a command runs.
 *
 * Returns the exit code to stop with when the command should not run (the CLI
 * was just updated, or the prompt was cancelled), and undefined to continue.
 */
export async function checkForCliUpdate(overrides: Partial<UpdateCheckOptions> = {}): Promise<number | undefined> {
  const options = { ...defaults(), ...overrides }
  if (!options.interactive || updateCheckSuppressed(options.env)) return undefined

  const state = readUpdateState(options.statePath)
  if (state.disabled) return undefined
  const manager = options.packageManager()
  if (!manager) return undefined

  const now = options.now()
  if (due(state.checkedAt, now)) {
    // Recorded first, so concurrent commands start one check and an
    // unreachable registry is retried a day later rather than every run.
    writeUpdateState(options.statePath, { checkedAt: now.toISOString() })
    options.startRefresh()
  }

  const latest = state.latestVersion
  if (!latest || !isNewerStable(latest, options.currentVersion) || state.promptedVersion === latest) {
    return undefined
  }

  // Shown once per version, whatever the answer.
  writeUpdateState(options.statePath, { promptedVersion: latest })
  const install = installCommand(manager, latest)
  const choice = await options.choose(options.currentVersion, latest, install)
  if (choice === 'cancel') return 1
  if (choice === 'later') return undefined
  if (choice === 'never') {
    writeUpdateState(options.statePath, { disabled: true })
    options.log(`BusinessLens will not offer CLI updates again. Delete ${options.statePath} to turn the reminder back on.`)
    return undefined
  }

  if (options.runInstall(install)) {
    options.log(`Updated the BusinessLens CLI to ${latest}. Run your command again to use it.`)
    return 0
  }
  options.error(
    `error: the update to ${latest} did not complete; continuing with ${options.currentVersion}.\n`
    + `To update later, run: ${formatCommand(install)}`
  )
  return undefined
}
