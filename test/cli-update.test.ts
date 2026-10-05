import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  checkForCliUpdate,
  fetchLatestVersion,
  installCommand,
  isNewerStable,
  packageManagerFor,
  readUpdateState,
  refreshLatestVersion,
  updateCheckSuppressed,
  updateStatePath,
  writeUpdateState,
  type InstallCommand,
  type UpdateCheckOptions,
  type UpdateChoice
} from '../src/core/cli-update.js'

const NOW = new Date('2026-10-05T12:00:00.000Z')
const HOUR = 60 * 60 * 1000

function registryResponse(body: unknown, status = 200): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch
}

describe('version comparison', () => {
  it('offers only later stable releases', () => {
    expect(isNewerStable('0.8.0', '0.7.1')).toBe(true)
    expect(isNewerStable('0.7.2', '0.7.1')).toBe(true)
    expect(isNewerStable('1.0.0', '0.99.99')).toBe(true)
    expect(isNewerStable('0.10.0', '0.9.0')).toBe(true)
    expect(isNewerStable('0.7.1', '0.7.1')).toBe(false)
    expect(isNewerStable('0.7.0', '0.7.1')).toBe(false)
    expect(isNewerStable('0.9.0', '0.10.0')).toBe(false)
  })

  it('never offers a prerelease, and treats a release as newer than its own prereleases', () => {
    expect(isNewerStable('0.8.0-beta.1', '0.7.1')).toBe(false)
    expect(isNewerStable('0.8.0', '0.8.0-beta.1')).toBe(true)
    expect(isNewerStable('0.8.0', '0.8.0+build.5')).toBe(false)
  })

  it('ignores versions that are not semantic versions', () => {
    expect(isNewerStable('latest', '0.7.1')).toBe(false)
    expect(isNewerStable('0.8', '0.7.1')).toBe(false)
    expect(isNewerStable('0.8.0', 'dev')).toBe(false)
  })
})

describe('version discovery', () => {
  it('reads the stable latest dist-tag from the registry', async () => {
    const fetchImpl = registryResponse({ latest: '0.8.0', next: '0.9.0-beta.1' })
    expect(await fetchLatestVersion({}, fetchImpl)).toBe('0.8.0')
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://registry.npmjs.org/-/package/businesslens/dist-tags',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it('uses the configured npm registry', async () => {
    const fetchImpl = registryResponse({ latest: '0.8.0' })
    await fetchLatestVersion({ npm_config_registry: 'https://npm.example.com/' }, fetchImpl)
    expect(fetchImpl).toHaveBeenCalledWith('https://npm.example.com/-/package/businesslens/dist-tags', expect.anything())
  })

  it('finds nothing when the registry fails, answers oddly, or tags a prerelease latest', async () => {
    expect(await fetchLatestVersion({}, registryResponse({ error: 'Not found' }, 404))).toBeUndefined()
    expect(await fetchLatestVersion({}, registryResponse({ latest: 7 }))).toBeUndefined()
    expect(await fetchLatestVersion({}, registryResponse({ latest: '0.8.0-rc.1' }))).toBeUndefined()
    const offline = vi.fn(async () => { throw new TypeError('fetch failed') }) as unknown as typeof fetch
    expect(await fetchLatestVersion({}, offline)).toBeUndefined()
  })
})

describe('update state', () => {
  let dir: string
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'bl-update-')) })
  afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

  it('lives in the user configuration directory', () => {
    expect(updateStatePath({}, 'darwin', '/home/a')).toBe('/home/a/.config/businesslens/update-check.json')
    expect(updateStatePath({ XDG_CONFIG_HOME: '/xdg' }, 'linux', '/home/a')).toBe('/xdg/businesslens/update-check.json')
    expect(updateStatePath({ APPDATA: 'C:/Users/a/AppData/Roaming' }, 'win32', 'C:/Users/a'))
      .toBe(join('C:/Users/a/AppData/Roaming', 'businesslens', 'update-check.json'))
  })

  it('merges writes and survives a missing or corrupt file', () => {
    const path = join(dir, 'nested', 'update-check.json')
    expect(readUpdateState(path)).toEqual({})
    writeUpdateState(path, { promptedVersion: '0.8.0' })
    writeUpdateState(path, { disabled: true })
    expect(readUpdateState(path)).toEqual({ promptedVersion: '0.8.0', disabled: true })
    writeFileSync(path, '{ not json')
    expect(readUpdateState(path)).toEqual({})
  })

  it('records the latest release found by the background check, keeping earlier answers', async () => {
    const path = join(dir, 'update-check.json')
    writeUpdateState(path, { promptedVersion: '0.7.5' })
    await refreshLatestVersion(path, {}, registryResponse({ latest: '0.8.0' }), () => NOW)
    expect(readUpdateState(path)).toEqual({
      promptedVersion: '0.7.5',
      latestVersion: '0.8.0',
      checkedAt: NOW.toISOString()
    })
  })
})

describe('suppression', () => {
  it('is off by default and on in CI or with BUSINESSLENS_NO_UPDATE_CHECK', () => {
    expect(updateCheckSuppressed({})).toBe(false)
    expect(updateCheckSuppressed({ CI: 'false' })).toBe(false)
    expect(updateCheckSuppressed({ BUSINESSLENS_NO_UPDATE_CHECK: '0' })).toBe(false)
    expect(updateCheckSuppressed({ CI: 'true' })).toBe(true)
    expect(updateCheckSuppressed({ GITHUB_ACTIONS: 'true' })).toBe(true)
    expect(updateCheckSuppressed({ BUSINESSLENS_NO_UPDATE_CHECK: '1' })).toBe(true)
  })
})

describe('package manager detection', () => {
  const exists = (paths: string[]) => (path: string) => paths.includes(path.replace(/\\/g, '/'))

  it('finds global npm installations, including a configured prefix', () => {
    expect(packageManagerFor('/usr/local/lib/node_modules/businesslens', 'darwin', exists(['/usr/local/bin/businesslens'])))
      .toBe('npm')
    expect(packageManagerFor('/home/a/.npm-global/lib/node_modules/businesslens', 'linux', exists(['/home/a/.npm-global/bin/businesslens'])))
      .toBe('npm')
    expect(packageManagerFor('C:\\Users\\a\\AppData\\Roaming\\npm\\node_modules\\businesslens', 'win32', exists(['C:/Users/a/AppData/Roaming/npm/businesslens.cmd'])))
      .toBe('npm')
  })

  it('finds global pnpm, Yarn and Bun installations', () => {
    expect(packageManagerFor('/Users/a/Library/pnpm/global/5/.pnpm/businesslens@0.7.1/node_modules/businesslens', 'darwin', exists([])))
      .toBe('pnpm')
    expect(packageManagerFor('/home/a/.config/yarn/global/node_modules/businesslens', 'linux', exists([]))).toBe('yarn')
    expect(packageManagerFor('C:/Users/a/AppData/Local/Yarn/Data/global/node_modules/businesslens', 'win32', exists([]))).toBe('yarn')
    expect(packageManagerFor('/home/a/.bun/install/global/node_modules/businesslens', 'linux', exists([]))).toBe('bun')
  })

  it('leaves npx runs, project dependencies and checkouts alone', () => {
    expect(packageManagerFor('/home/a/.npm/_npx/0123456789abcdef/node_modules/businesslens', 'linux', exists([]))).toBeUndefined()
    expect(packageManagerFor('/work/shop/node_modules/businesslens', 'linux', exists([]))).toBeUndefined()
    expect(packageManagerFor('/work/lib/node_modules/businesslens', 'linux', exists([]))).toBeUndefined()
    expect(packageManagerFor('/work/pdd', 'linux', exists([]))).toBeUndefined()
  })

  it('installs exactly the offered version with the owning package manager', () => {
    expect(installCommand('npm', '0.8.0')).toEqual({ command: 'npm', args: ['install', '--global', 'businesslens@0.8.0'] })
    expect(installCommand('pnpm', '0.8.0')).toEqual({ command: 'pnpm', args: ['add', '--global', 'businesslens@0.8.0'] })
    expect(installCommand('yarn', '0.8.0')).toEqual({ command: 'yarn', args: ['global', 'add', 'businesslens@0.8.0'] })
    expect(installCommand('bun', '0.8.0')).toEqual({ command: 'bun', args: ['add', '--global', 'businesslens@0.8.0'] })
  })
})

describe('update prompt', () => {
  let dir: string
  let statePath: string
  let choices: UpdateChoice[]
  let installs: InstallCommand[]
  let installSucceeds: boolean
  let output: string[]
  let refreshes: number

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'bl-update-'))
    statePath = join(dir, 'update-check.json')
    choices = []
    installs = []
    installSucceeds = true
    output = []
    refreshes = 0
  })
  afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

  function run(overrides: Partial<UpdateCheckOptions> = {}): Promise<number | undefined> {
    return checkForCliUpdate({
      env: {},
      interactive: true,
      currentVersion: '0.7.1',
      statePath,
      now: () => NOW,
      packageManager: () => 'npm',
      startRefresh: () => { refreshes += 1 },
      choose: vi.fn(async () => {
        const choice = choices.shift()
        if (!choice) throw new Error('prompted unexpectedly')
        return choice
      }),
      runInstall: (install) => { installs.push(install); return installSucceeds },
      log: message => output.push(message),
      error: message => output.push(message),
      ...overrides
    })
  }

  function known(latestVersion: string, extra = {}): void {
    writeUpdateState(statePath, { latestVersion, checkedAt: new Date(NOW.getTime() - HOUR).toISOString(), ...extra })
  }

  it('shows the installed and available versions and the command it would run', async () => {
    known('0.8.0')
    choices = ['later']
    const choose = vi.fn(async () => choices.shift()!)
    await run({ choose })
    expect(choose).toHaveBeenCalledWith('0.7.1', '0.8.0', {
      command: 'npm',
      args: ['install', '--global', 'businesslens@0.8.0']
    })
  })

  it('prompts once per available version: Not now suppresses that version until a later release', async () => {
    known('0.8.0')
    choices = ['later']
    expect(await run()).toBeUndefined()
    expect(await run()).toBeUndefined()
    expect(installs).toEqual([])

    known('0.8.1')
    choices = ['later']
    expect(await run()).toBeUndefined()
    expect(choices).toEqual([])
    expect(readUpdateState(statePath).promptedVersion).toBe('0.8.1')
  })

  it('persists Do not remind me again across releases and explains how to undo it', async () => {
    known('0.8.0')
    choices = ['never']
    expect(await run()).toBeUndefined()
    expect(readUpdateState(statePath).disabled).toBe(true)
    expect(output.join('\n')).toContain(`Delete ${statePath}`)

    known('0.9.0')
    expect(await run()).toBeUndefined()
    expect(installs).toEqual([])
    expect(refreshes).toBe(0)
  })

  it('installs the offered version on approval and stops before the command runs', async () => {
    known('0.8.0')
    choices = ['update']
    expect(await run()).toBe(0)
    expect(installs).toEqual([{ command: 'npm', args: ['install', '--global', 'businesslens@0.8.0'] }])
    expect(output.join('\n')).toContain('Updated the BusinessLens CLI to 0.8.0')
  })

  it('reports a failed update with the command to retry and continues with the installed version', async () => {
    known('0.8.0')
    choices = ['update']
    installSucceeds = false
    expect(await run()).toBeUndefined()
    const message = output.join('\n')
    expect(message).toContain('continuing with 0.7.1')
    expect(message).toContain('npm install --global businesslens@0.8.0')
    expect(await run()).toBeUndefined()
    expect(installs).toHaveLength(1)
  })

  it('stops the command when the prompt is cancelled, without installing', async () => {
    known('0.8.0')
    choices = ['cancel']
    expect(await run()).toBe(1)
    expect(installs).toEqual([])
    expect(await run()).toBeUndefined()
  })

  it('stays silent and offline without a terminal, in CI, when suppressed, or where it cannot update', async () => {
    known('0.8.0', { checkedAt: undefined })
    for (const overrides of [
      { interactive: false },
      { env: { CI: '1' } },
      { env: { BUSINESSLENS_NO_UPDATE_CHECK: '1' } },
      { packageManager: () => undefined }
    ] satisfies Partial<UpdateCheckOptions>[]) {
      expect(await run(overrides)).toBeUndefined()
    }
    expect(refreshes).toBe(0)
    expect(installs).toEqual([])
    expect(readUpdateState(statePath).promptedVersion).toBeUndefined()
  })

  it('does not offer the installed or an older version', async () => {
    known('0.7.1')
    expect(await run()).toBeUndefined()
    known('0.7.0')
    expect(await run()).toBeUndefined()
  })

  it('starts one background check a day without waiting for it', async () => {
    expect(await run()).toBeUndefined()
    expect(await run()).toBeUndefined()
    expect(refreshes).toBe(1)
    expect(readUpdateState(statePath).checkedAt).toBe(NOW.toISOString())

    const tomorrow = new Date(NOW.getTime() + 24 * HOUR)
    expect(await run({ now: () => tomorrow })).toBeUndefined()
    expect(refreshes).toBe(2)
  })
})
