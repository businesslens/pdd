import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildProject } from '../src/commands/build.js'
import { runPull } from '../src/commands/pull.js'
import { writeCredentials } from '../src/core/credentials.js'
import { reportDigest } from '../src/core/report-digest.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')
const temporaryDirectories: string[] = []
const accessToken = 'pull-session-secret'

let report: Record<string, unknown>

function temporary(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

function initialize(cwd: string): void {
  execFileSync('git', ['init', '--initial-branch=main'], { cwd, stdio: 'pipe' })
  execFileSync('git', ['config', 'user.email', 'fixture@example.com'], { cwd, stdio: 'pipe' })
  execFileSync('git', ['config', 'user.name', 'Fixture'], { cwd, stdio: 'pipe' })
  execFileSync('git', ['add', '.'], { cwd, stdio: 'pipe' })
  execFileSync('git', ['commit', '-m', 'fixture'], { cwd, stdio: 'pipe' })
}

function credentials(): string {
  const configDir = temporary('bl-pull-credentials-')
  writeCredentials({
    schema: 1,
    platformUrl: 'http://127.0.0.1:3000',
    accessToken,
    expiresAt: '2099-01-01T00:00:00.000Z'
  }, configDir)
  return configDir
}

function reportResponse(
  canonicalName = 'fixture-shop',
  version = 3,
  digest = reportDigest(JSON.parse(JSON.stringify(report)))
): Response {
  return new Response(JSON.stringify(report), {
    headers: {
      'content-type': 'application/vnd.businesslens.report+json; version=4',
      'x-businesslens-blueprint': canonicalName,
      'x-businesslens-revision': String(version),
      'x-businesslens-report-digest': digest
    }
  })
}

beforeAll(() => {
  const source = temporary('bl-pull-source-')
  cpSync(FIXTURE, source, { recursive: true })
  initialize(source)
  report = buildProject(source).report
})

afterEach(() => {
  vi.restoreAllMocks()
})

afterAll(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('Blueprint pull', () => {
  it('pulls latest by canonical name and expands without saving report.json', async () => {
    const target = temporary('bl-pull-target-')
    const configDir = credentials()
    const fetcher = vi.fn(async () => reportResponse())
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    expect(await runPull(
      target,
      'fixture-shop',
      { force: false },
      { configDir, fetch: fetcher as typeof fetch }
    )).toBe(0)

    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:3000/api/v1/hub/blueprints/fixture-shop/report.json',
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: `Bearer ${accessToken}` }),
        redirect: 'manual'
      })
    )
    expect(existsSync(join(target, '.businesslens/product.md'))).toBe(true)
    expect(existsSync(join(target, '.businesslens/build/report.json'))).toBe(false)
    expect(readFileSync(join(target, '.businesslens/coverage.md'), 'utf8'))
      .toContain('status: draft')
    expect(readFileSync(
      join(target, '.businesslens/journeys/browse-and-buy/journey.md'),
      'utf8'
    )).not.toContain('src/routes/storefront.ts')
    expect(readFileSync(
      join(target, '.businesslens/experiences/storefront.md'),
      'utf8'
    )).toContain('- web: /')
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('version 3'))
    expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain(accessToken)
  })

  it('pulls an exact version and verifies the resolved version header', async () => {
    const target = temporary('bl-pull-version-')
    const configDir = credentials()
    const fetcher = vi.fn(async () => reportResponse('fixture-shop', 7))
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    expect(await runPull(
      target,
      'fixture-shop',
      { version: 7, force: false },
      { configDir, fetch: fetcher as typeof fetch }
    )).toBe(0)
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('/releases/7/report.json'),
      expect.any(Object)
    )
  })

  it('requires login before making a request', async () => {
    const target = temporary('bl-pull-no-login-')
    const configDir = temporary('bl-pull-empty-config-')
    const fetcher = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runPull(
      target,
      'fixture-shop',
      { force: false },
      { configDir, fetch: fetcher as typeof fetch }
    )).toBe(1)
    expect(fetcher).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('businesslens login'))
  })

  it('rejects an invalid digest before writing files', async () => {
    const target = temporary('bl-pull-digest-')
    const fetcher = vi.fn(async () => reportResponse(
      'fixture-shop',
      3,
      '0'.repeat(64)
    ))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runPull(
      target,
      'fixture-shop',
      { force: false },
      { configDir: credentials(), fetch: fetcher as typeof fetch }
    )).toBe(1)
    expect(existsSync(join(target, '.businesslens'))).toBe(false)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('digest does not match'))
  })

  it('rejects redirects and never forwards the CLI session', async () => {
    const target = temporary('bl-pull-redirect-')
    const fetcher = vi.fn(async () => new Response(null, {
      status: 302,
      headers: { location: 'https://attacker.example/report.json' }
    }))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runPull(
      target,
      'fixture-shop',
      { force: false },
      { configDir: credentials(), fetch: fetcher as typeof fetch }
    )).toBe(1)
    expect(fetcher).toHaveBeenCalledOnce()
    expect(existsSync(join(target, '.businesslens'))).toBe(false)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('redirected'))
  })

  it('rejects mismatched names, versions, and invalid canonical input', async () => {
    const nameTarget = temporary('bl-pull-name-')
    const versionTarget = temporary('bl-pull-resolved-version-')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runPull(
      nameTarget,
      'fixture-shop',
      { force: false },
      {
        configDir: credentials(),
        fetch: (async () => reportResponse('other/fixture-shop', 3)) as typeof fetch
      }
    )).toBe(1)
    expect(await runPull(
      versionTarget,
      'fixture-shop',
      { version: 4, force: false },
      {
        configDir: credentials(),
        fetch: (async () => reportResponse('fixture-shop', 3)) as typeof fetch
      }
    )).toBe(1)
    expect(await runPull(
      temporary('bl-pull-invalid-name-'),
      'Fixture Shop',
      { force: false },
      { configDir: credentials() }
    )).toBe(2)
  })
})
