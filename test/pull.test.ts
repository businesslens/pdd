import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildProject } from '../src/commands/export.js'
import { runPull } from '../src/commands/pull.js'
import { redactSourceEvidence } from '../src/core/portable.js'
import { reportDigest } from '../src/core/report-digest.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')
const temporaryDirectories: string[] = []

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

function reportResponse(canonicalName = 'fixture-shop'): Response {
  return new Response(JSON.stringify(report), {
    status: 200,
    headers: {
      'content-type': 'application/vnd.businesslens.report+json; version=5',
      'x-businesslens-blueprint': canonicalName,
      'x-businesslens-report-digest': reportDigest(report)
    }
  })
}

beforeAll(() => {
  const source = temporary('bl-pull-source-')
  cpSync(FIXTURE, source, { recursive: true })
  initialize(source)
  report = redactSourceEvidence(buildProject(source).report) as unknown as Record<string, unknown>
})

afterEach(() => {
  vi.restoreAllMocks()
})

afterAll(() => {
  let directory = temporaryDirectories.pop()
  while (directory) {
    rmSync(directory, { recursive: true, force: true })
    directory = temporaryDirectories.pop()
  }
})

describe('pull', () => {
  it('pulls anonymously from the default catalog and expands the model', async () => {
    const target = temporary('bl-pull-target-')
    let requested: { url: string, init: RequestInit } | undefined
    const fetch = vi.fn(async (url: string, init: RequestInit) => {
      requested = { url: String(url), init }
      return reportResponse()
    }) as unknown as typeof globalThis.fetch

    expect(await runPull(target, 'fixture-shop', { force: false }, { fetch, env: {} })).toBe(0)

    expect(requested?.url).toBe('https://businesslens.io/api/v1/blueprints/fixture-shop/report.json')
    // No credential is read, sent, or required.
    expect((requested?.init.headers as Record<string, string>).authorization).toBeUndefined()
    expect((requested?.init.headers as Record<string, string>).accept).toContain('version=5')
    expect((requested?.init.headers as Record<string, string>).accept).toContain('version=4')
    expect(existsSync(join(target, '.businesslens/product.md'))).toBe(true)
    expect(existsSync(join(target, '.businesslens/screens/product-record.md'))).toBe(true)
  })

  it('identifies itself so catalog pulls are distinguishable from page views', async () => {
    const target = temporary('bl-pull-agent-')
    let headers: Record<string, string> = {}
    const fetch = vi.fn(async (_url: string, init: RequestInit) => {
      headers = init.headers as Record<string, string>
      return reportResponse()
    }) as unknown as typeof globalThis.fetch

    await runPull(target, 'fixture-shop', { force: false }, { fetch, env: {} })
    expect(headers['user-agent']).toMatch(/^businesslens\//)
  })

  it('writes a model README telling an agent to build the product', async () => {
    const target = temporary('bl-pull-readme-')
    const fetch = vi.fn(async () => reportResponse()) as unknown as typeof globalThis.fetch

    expect(await runPull(target, 'fixture-shop', { force: false }, { fetch, env: {} })).toBe(0)

    const readme = readFileSync(join(target, '.businesslens', 'README.md'), 'utf8')
    expect(readme).toContain('BusinessLens Product Model')
    expect(readme).toContain('acceptance contract')
    expect(existsSync(join(target, 'AGENTS.md'))).toBe(false)
  })

  it('accepts an arbitrary catalog origin, because no credential is sent', async () => {
    const target = temporary('bl-pull-origin-')
    let url = ''
    const fetch = vi.fn(async (requestUrl: string) => {
      url = String(requestUrl)
      return reportResponse()
    }) as unknown as typeof globalThis.fetch

    expect(await runPull(
      target,
      'fixture-shop',
      { force: false, catalog: 'https://catalog.example.com' },
      { fetch, env: {} }
    )).toBe(0)
    expect(url.startsWith('https://catalog.example.com/')).toBe(true)
  })

  it('prefers --catalog over BUSINESSLENS_CATALOG_URL', async () => {
    const target = temporary('bl-pull-precedence-')
    let url = ''
    const fetch = vi.fn(async (requestUrl: string) => {
      url = String(requestUrl)
      return reportResponse()
    }) as unknown as typeof globalThis.fetch

    await runPull(
      target,
      'fixture-shop',
      { force: false, catalog: 'http://localhost:3200' },
      { fetch, env: { BUSINESSLENS_CATALOG_URL: 'https://env.example.com' } }
    )
    expect(url.startsWith('http://localhost:3200/')).toBe(true)
  })

  it('refuses a plaintext catalog that is not loopback', async () => {
    const target = temporary('bl-pull-plaintext-')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const fetch = vi.fn() as unknown as typeof globalThis.fetch

    expect(await runPull(
      target,
      'fixture-shop',
      { force: false, catalog: 'http://catalog.example.com' },
      { fetch, env: {} }
    )).toBe(1)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('reports a database outage as a temporary catalog problem', async () => {
    const target = temporary('bl-pull-503-')
    const errors: string[] = []
    vi.spyOn(console, 'error').mockImplementation((message: string) => { errors.push(message) })
    const fetch = vi.fn(async () => new Response('{}', { status: 503 })) as unknown as typeof globalThis.fetch

    expect(await runPull(target, 'fixture-shop', { force: false }, { fetch, env: {} })).toBe(1)
    expect(errors.join('\n')).toContain('temporarily unavailable')
  })

  it('reports a withdrawn Blueprint distinctly from an unknown one', async () => {
    const gone = temporary('bl-pull-410-')
    const missing = temporary('bl-pull-404-')
    const errors: string[] = []
    vi.spyOn(console, 'error').mockImplementation((message: string) => { errors.push(message) })

    await runPull(gone, 'fixture-shop', { force: false }, {
      fetch: vi.fn(async () => new Response('{}', { status: 410 })) as unknown as typeof globalThis.fetch,
      env: {}
    })
    await runPull(missing, 'fixture-shop', { force: false }, {
      fetch: vi.fn(async () => new Response('{}', { status: 404 })) as unknown as typeof globalThis.fetch,
      env: {}
    })

    expect(errors[0]).toContain('withdrawn')
    expect(errors[1]).toContain('No such Blueprint')
  })

  it('refuses a report whose digest does not match the catalog header', async () => {
    const target = temporary('bl-pull-digest-')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const fetch = vi.fn(async () => new Response(JSON.stringify(report), {
      status: 200,
      headers: {
        'content-type': 'application/vnd.businesslens.report+json; version=5',
        'x-businesslens-blueprint': 'fixture-shop',
        'x-businesslens-report-digest': 'a'.repeat(64)
      }
    })) as unknown as typeof globalThis.fetch

    expect(await runPull(target, 'fixture-shop', { force: false }, { fetch, env: {} })).toBe(1)
    expect(existsSync(join(target, '.businesslens'))).toBe(false)
  })

  it('refuses a report served for a different Blueprint', async () => {
    const target = temporary('bl-pull-mismatch-')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const fetch = vi.fn(async () => reportResponse('something-else')) as unknown as typeof globalThis.fetch

    expect(await runPull(target, 'fixture-shop', { force: false }, { fetch, env: {} })).toBe(1)
    expect(existsSync(join(target, '.businesslens'))).toBe(false)
  })

  it('refuses a redirected response', async () => {
    const target = temporary('bl-pull-redirect-')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const fetch = vi.fn(async () => new Response('', {
      status: 302,
      headers: { location: 'https://elsewhere.example.com/report.json' }
    })) as unknown as typeof globalThis.fetch

    expect(await runPull(target, 'fixture-shop', { force: false }, { fetch, env: {} })).toBe(1)
    expect(existsSync(join(target, '.businesslens'))).toBe(false)
  })

  it('refuses a body over the 8 MiB safety limit', async () => {
    const target = temporary('bl-pull-oversized-')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const fetch = vi.fn(async () => new Response(JSON.stringify(report), {
      status: 200,
      headers: {
        'content-type': 'application/vnd.businesslens.report+json; version=5',
        'content-length': String(9 * 1024 * 1024),
        'x-businesslens-blueprint': 'fixture-shop',
        'x-businesslens-report-digest': reportDigest(report)
      }
    })) as unknown as typeof globalThis.fetch

    expect(await runPull(target, 'fixture-shop', { force: false }, { fetch, env: {} })).toBe(1)
    expect(existsSync(join(target, '.businesslens'))).toBe(false)
  })

  it('rejects a name that is not a canonical slug', async () => {
    const target = temporary('bl-pull-name-')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const fetch = vi.fn() as unknown as typeof globalThis.fetch

    expect(await runPull(target, 'Not A Slug', { force: false }, { fetch, env: {} })).toBe(2)
    expect(fetch).not.toHaveBeenCalled()
  })
})
