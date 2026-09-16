import { request } from 'node:http'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { startLocalViewer, type LocalViewer } from '../src/core/local-viewer-server.js'
import type { ProductReportV13 } from '../src/core/portable.js'
import { compileReport, compileResolvedWorkspaceReport } from '../src/commands/export.js'
import { createCommittedReportSource, ensureCheckpointsDirectory, listCheckpoints, writeCheckpoint } from '../src/core/checkpoints.js'
import { loadModel } from '../src/core/model.js'
import { resolveModelRoot } from '../src/core/model-root.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')

interface ResponseResult {
  body: string
  headers: Record<string, string | string[] | undefined>
  status: number
}

const ASYNC_TIMEOUT_MS = 4500
const WATCH_TEST_TIMEOUT_MS = 15_000
const WATCH_SETTLE_MS = 100

function get(url: string, path = '/', host?: string): Promise<ResponseResult> {
  const origin = new URL(url)
  return new Promise((resolve, reject) => {
    const outgoing = request({
      hostname: origin.hostname,
      port: origin.port,
      path,
      method: 'GET',
      headers: host ? { host } : undefined
    }, (incoming) => {
      const chunks: Buffer[] = []
      incoming.on('data', chunk => chunks.push(Buffer.from(chunk)))
      incoming.on('end', () => resolve({
        status: incoming.statusCode ?? 0,
        headers: incoming.headers,
        body: Buffer.concat(chunks).toString('utf8')
      }))
    })
    outgoing.on('error', reject)
    outgoing.end()
  })
}

function eventAfter(
  url: string,
  eventName: string,
  trigger: () => void,
  timeoutMs = ASYNC_TIMEOUT_MS
): Promise<string> {
  const origin = new URL(url)
  return new Promise((resolve, reject) => {
    let triggerTimer: ReturnType<typeof setTimeout> | undefined
    const timeout = setTimeout(() => {
      if (triggerTimer) clearTimeout(triggerTimer)
      reject(new Error(`Timed out waiting for ${eventName}`))
    }, timeoutMs)
    const outgoing = request({
      hostname: origin.hostname,
      port: origin.port,
      path: '/_businesslens/events',
      method: 'GET'
    }, (incoming) => {
      let body = ''
      let triggered = false
      let armed = false
      incoming.setEncoding('utf8')
      incoming.on('data', (chunk) => {
        body += chunk
        if (!triggered && body.includes(': connected\n\n')) {
          triggered = true
          triggerTimer = setTimeout(() => {
            body = ''
            armed = true
            try {
              trigger()
            } catch (error) {
              clearTimeout(timeout)
              reject(error)
            }
          }, WATCH_SETTLE_MS)
        }
        if (!armed || !body.includes(`event: ${eventName}\n`)) return
        clearTimeout(timeout)
        if (triggerTimer) clearTimeout(triggerTimer)
        incoming.destroy()
        resolve(body)
      })
    })
    outgoing.on('error', (error) => {
      clearTimeout(timeout)
      if (triggerTimer) clearTimeout(triggerTimer)
      reject(error)
    })
    outgoing.end()
  })
}

async function eventually<T>(
  read: () => Promise<T>,
  matches: (value: T) => boolean,
  timeoutMs = ASYNC_TIMEOUT_MS
): Promise<T> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const value = await read()
    if (matches(value)) return value
    await new Promise(resolve => setTimeout(resolve, 30))
  }
  throw new Error('Timed out waiting for the local report to update.')
}

const viewers: LocalViewer[] = []
const directories: string[] = []

afterEach(async () => {
  await Promise.all(viewers.splice(0).map(viewer => viewer.close()))
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

function staticViewer(): string {
  const directory = mkdtempSync(join(tmpdir(), 'businesslens-viewer-'))
  directories.push(directory)
  writeFileSync(join(directory, 'index.html'), '<!doctype html><title>Local Product Model</title>')
  writeFileSync(join(directory, 'app.js'), 'globalThis.businesslens = true')
  writeFileSync(join(directory, 'site.webmanifest'), '{"name":"BusinessLens"}')
  return directory
}

function report(): ProductReportV13 {
  return { id: 'fixture-shop', title: 'Fixture Shop' } as ProductReportV13
}

const logo = (color = '#80552b') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${color}"/></svg>`

describe('local Product Report server', () => {
  it('serves the static application and caches the compiled report', async () => {
    let compileCount = 0
    const root = staticViewer()
    const logoFile = join(root, 'logo.svg')
    writeFileSync(logoFile, logo())
    const viewer = await startLocalViewer({
      viewerRoot: root,
      logoFile,
      compile: () => {
        compileCount += 1
        return report()
      }
    })
    viewers.push(viewer)

    const page = await get(viewer.url)
    expect(page.status).toBe(200)
    expect(page.body).toContain('Local Product Model')
    expect(page.headers['content-type']).toBe('text/html; charset=utf-8')
    expect(page.headers['cache-control']).toBe('no-store')
    expect(page.headers['content-security-policy']).toContain("default-src 'none'")

    const first = await get(viewer.url, '/_businesslens/report.json')
    const second = await get(viewer.url, '/_businesslens/report.json')
    expect(first.status).toBe(200)
    expect(JSON.parse(first.body)).toMatchObject({ id: 'fixture-shop' })
    expect(second.status).toBe(200)
    expect(compileCount).toBe(1)

    const health = await get(viewer.url, '/_businesslens/health')
    expect(health.status).toBe(200)
    expect(JSON.parse(health.body)).toEqual({ ok: true })

    const productLogo = await get(viewer.url, '/_businesslens/logo.svg')
    expect(productLogo.status).toBe(200)
    expect(productLogo.headers['content-type']).toBe('image/svg+xml; charset=utf-8')
    expect(productLogo.headers['content-security-policy']).toContain("script-src 'none'")
    expect(productLogo.headers['content-security-policy']).toContain('sandbox')
    expect(productLogo.body).toContain('<svg')

    const manifest = await get(viewer.url, '/site.webmanifest')
    expect(manifest.status).toBe(200)
    expect(manifest.headers['content-type']).toBe('application/manifest+json; charset=utf-8')
  })

  it('serves the shared packaged brand without duplicating it in the static viewer', async () => {
    const viewer = await startLocalViewer({ viewerRoot: staticViewer(), compile: report })
    viewers.push(viewer)
    const icon = await get(viewer.url, '/brand/icons/favicon.svg')
    expect(icon.status).toBe(200)
    expect(icon.headers['content-type']).toBe('image/svg+xml')
    expect(icon.body).toBe(readFileSync(new URL('../layers/nuxt/theme/public/brand/icons/favicon.svg', import.meta.url), 'utf8'))
    for (const path of ['/brand/missing.svg', '/brand/%2e%2e%2fnuxt.config.ts', '/brand/%ZZ']) {
      expect((await get(viewer.url, path)).status).toBe(404)
    }
  })

  it('watches model sources and announces a new report over server-sent events', { timeout: WATCH_TEST_TIMEOUT_MS }, async () => {
    const model = mkdtempSync(join(tmpdir(), 'businesslens-model-'))
    directories.push(model)
    const product = join(model, 'product.md')
    writeFileSync(product, 'First title')

    const viewer = await startLocalViewer({
      viewerRoot: staticViewer(),
      watchRoot: model,
      debounceMs: 10,
      compile: () => ({ ...report(), title: readFileSync(product, 'utf8') })
    })
    viewers.push(viewer)

    const [event, updated] = await Promise.all([
      eventAfter(
        viewer.url,
        'report',
        () => writeFileSync(product, 'Updated title'),
        WATCH_TEST_TIMEOUT_MS - 500
      ),
      eventually(
        () => get(viewer.url, '/_businesslens/report.json'),
        response => JSON.parse(response.body).title === 'Updated title',
        WATCH_TEST_TIMEOUT_MS - 500
      )
    ])

    expect(JSON.parse(updated.body).title).toBe('Updated title')
    expect(event).toMatch(/"revision":\d+/)
  })

  it('announces a valid logo edit even when the semantic report is unchanged', { timeout: WATCH_TEST_TIMEOUT_MS }, async () => {
    const model = mkdtempSync(join(tmpdir(), 'businesslens-logo-model-'))
    directories.push(model)
    const logoFile = join(model, 'logo.svg')
    writeFileSync(logoFile, logo())

    const viewer = await startLocalViewer({
      viewerRoot: staticViewer(),
      watchRoot: model,
      logoFile,
      debounceMs: 10,
      compile: report
    })
    viewers.push(viewer)

    const event = eventAfter(
      viewer.url,
      'report',
      () => writeFileSync(logoFile, logo('#b8965c')),
      WATCH_TEST_TIMEOUT_MS - 500
    )
    expect(await event).toContain('event: report')
    expect((await get(viewer.url, '/_businesslens/logo.svg')).body).toContain('#b8965c')
  })

  it('keeps the last valid report while an edit has compile errors, then recovers', async () => {
    let invalid = false
    const viewer = await startLocalViewer({
      viewerRoot: staticViewer(),
      compile: () => {
        if (invalid) throw new Error('Lint failed: missing actor')
        return report()
      }
    })
    viewers.push(viewer)

    invalid = true
    viewer.refresh()
    const stale = await get(viewer.url, '/_businesslens/report.json')
    expect(stale.status).toBe(200)
    expect(stale.headers['x-businesslens-report-state']).toBe('stale')
    expect(JSON.parse(stale.body).title).toBe('Fixture Shop')

    const recovery = eventAfter(viewer.url, 'report', () => {
      invalid = false
      viewer.refresh()
    })
    expect(await recovery).toContain('event: report')
    expect((await get(viewer.url, '/_businesslens/report.json')).headers['x-businesslens-report-state']).toBe('ready')
  })

  it('rejects non-loopback Host headers, traversal, and unsupported methods', async () => {
    const viewer = await startLocalViewer({ viewerRoot: staticViewer(), compile: report })
    viewers.push(viewer)

    expect((await get(viewer.url, '/', 'example.com')).status).toBe(403)
    expect((await get(viewer.url, '/%2e%2e%2foutside.txt')).status).toBe(404)

    const response = await fetch(viewer.url, { method: 'POST' })
    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('GET, HEAD')
  })

  it('serves repository assets from the mount, and refuses everything else', async () => {
    const repository = mkdtempSync(join(tmpdir(), 'businesslens-repo-'))
    directories.push(repository)
    mkdirSync(join(repository, 'docs'), { recursive: true })
    writeFileSync(join(repository, 'docs', 'mockup.png'), Buffer.from('89504e470d0a1a0a', 'hex'))
    writeFileSync(join(repository, 'docs', 'notes.md'), '# Notes')
    writeFileSync(join(repository, 'secrets.env'), 'TOKEN=nope')
    writeFileSync(join(repository, 'app.ts'), 'export const x = 1')

    const viewer = await startLocalViewer({
      viewerRoot: staticViewer(),
      compile: report,
      assetRoot: repository
    })
    viewers.push(viewer)

    const png = await get(viewer.url, '/_businesslens/file/docs/mockup.png')
    expect(png.status).toBe(200)
    expect(png.headers['content-type']).toBe('image/png')

    const markdown = await get(viewer.url, '/_businesslens/file/docs/notes.md')
    expect(markdown.status).toBe(200)
    expect(markdown.headers['content-type']).toContain('application/json')
    expect(JSON.parse(markdown.body)).toMatchObject({ kind: 'markdown', document: { nodes: [['h1', { id: 'notes' }, 'Notes']] } })
    expect((await get(viewer.url, '/_businesslens/file/docs/notes.md?raw=1')).body).toBe('# Notes')

    // Not on the allowlist: refused whether or not it exists, so the mount
    // cannot be used to probe for files.
    expect((await get(viewer.url, '/_businesslens/file/secrets.env')).status).toBe(404)
    expect((await get(viewer.url, '/_businesslens/file/app.ts')).status).toBe(404)
    expect((await get(viewer.url, '/_businesslens/file/docs/absent.png')).status).toBe(404)

    // Traversal, encoded traversal, and absolute paths stay inside the root.
    expect((await get(viewer.url, '/_businesslens/file/../../etc/passwd')).status).toBe(404)
    expect((await get(viewer.url, '/_businesslens/file/%2e%2e%2f%2e%2e%2fetc%2fpasswd')).status).toBe(404)
    expect((await get(viewer.url, '/_businesslens/file//etc/passwd')).status).toBe(404)
  })

  it('rejects an SVG asset that is not inert', async () => {
    const repository = mkdtempSync(join(tmpdir(), 'businesslens-repo-'))
    directories.push(repository)
    writeFileSync(join(repository, 'safe.svg'), logo())
    writeFileSync(
      join(repository, 'active.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><script>alert(1)</script></svg>'
    )

    const viewer = await startLocalViewer({
      viewerRoot: staticViewer(),
      compile: report,
      assetRoot: repository
    })
    viewers.push(viewer)

    expect((await get(viewer.url, '/_businesslens/file/safe.svg')).status).toBe(200)
    expect((await get(viewer.url, '/_businesslens/file/active.svg')).status).toBe(422)
  })

  it('serves no repository asset when no asset root is configured', async () => {
    const viewer = await startLocalViewer({ viewerRoot: staticViewer(), compile: report })
    viewers.push(viewer)
    expect((await get(viewer.url, '/_businesslens/file/package.json')).status).toBe(404)
  })

  it('starts with no model, says so, and comes alive when one is bound', { timeout: WATCH_TEST_TIMEOUT_MS }, async () => {
    const viewer = await startLocalViewer({
      viewerRoot: staticViewer(),
      waitingMessage: 'No Product Model yet. Waiting for .businesslens/ to be created.'
    })
    viewers.push(viewer)

    expect(viewer.status()).toEqual({ ready: false, error: 'No Product Model yet. Waiting for .businesslens/ to be created.' })
    const waiting = await get(viewer.url, '/_businesslens/report.json')
    expect(waiting.status).toBe(422)
    expect(JSON.parse(waiting.body).message).toContain('Waiting for .businesslens/')
    expect((await get(viewer.url)).status).toBe(200)

    const model = mkdtempSync(join(tmpdir(), 'businesslens-late-model-'))
    directories.push(model)
    const product = join(model, 'product.md')
    writeFileSync(product, 'Bound title')
    const bound = await eventAfter(viewer.url, 'report', () => {
      viewer.bind({
        watchRoot: model,
        compile: () => ({ ...report(), title: readFileSync(product, 'utf8') })
      })
    })
    expect(bound).toContain('event: report')
    expect(viewer.status().ready).toBe(true)
    expect(JSON.parse((await get(viewer.url, '/_businesslens/report.json')).body).title).toBe('Bound title')

    // The binding's watcher is live: a later save recompiles as usual.
    const edited = eventAfter(viewer.url, 'report', () => writeFileSync(product, 'Edited after binding'), WATCH_TEST_TIMEOUT_MS - 500)
    expect(await edited).toContain('event: report')
    expect(JSON.parse((await get(viewer.url, '/_businesslens/report.json')).body).title).toBe('Edited after binding')
  })

  it('returns a safe compile error without stopping the viewer', async () => {
    const viewer = await startLocalViewer({
      viewerRoot: staticViewer(),
      compile: () => { throw new Error('Lint failed: missing actor') }
    })
    viewers.push(viewer)

    const response = await get(viewer.url, '/_businesslens/report.json')
    expect(response.status).toBe(422)
    expect(JSON.parse(response.body)).toEqual({ message: 'Lint failed: missing actor' })
    expect((await get(viewer.url)).status).toBe(200)
  })

  describe('what changed', () => {
    const fixtureReport = () => compileReport(loadModel(FIXTURE), '2026-08-08')

    /* A model directory with an empty checkpoint ring, plus the pin the CLI wires. */
    function changesViewer(options: { committed?: boolean, current?: ProductReportV13 } = {}) {
      const model = mkdtempSync(join(tmpdir(), 'businesslens-changes-'))
      directories.push(model)
      mkdirSync(join(model, '.businesslens'))
      const checkpointsRoot = ensureCheckpointsDirectory(model)
      const committed = fixtureReport()
      return {
        model,
        checkpointsRoot,
        committed,
        start: () => startLocalViewer({
          viewerRoot: staticViewer(),
          debounceMs: 10,
          compile: () => options.current ?? fixtureReport(),
          checkpointsRoot,
          committed: options.committed === false
            ? () => { throw new Error('The Product Model has not been committed yet, so there is no committed baseline.') }
            : () => ({ commit: 'abcdef0123456789', subject: 'fixture', committedAt: '2026-08-08T00:00:00Z', report: committed }),
          pin: (report, label) => writeCheckpoint(model, report, { source: 'pin', label })
        })
      }
    }

    it('lists the committed model and every checkpoint as baselines, newest checkpoint first', async () => {
      const setup = changesViewer()
      writeCheckpoint(setup.model, setup.committed, { source: 'checkpoint', now: new Date('2026-09-15T09:00:00.000Z') })
      writeCheckpoint(setup.model, setup.committed, { source: 'checkpoint', label: 'Mapped billing', now: new Date('2026-09-15T10:00:00.000Z') })
      const viewer = await setup.start()
      viewers.push(viewer)

      const listing = JSON.parse((await get(viewer.url, '/_businesslens/changes')).body)
      expect(listing.baselines).toEqual([
        { id: 'head', kind: 'committed', available: true, at: '2026-08-08T00:00:00Z', detail: 'abcdef0 fixture' },
        { id: '20260915T100000000Z', kind: 'checkpoint', available: true, at: '2026-09-15T10:00:00.000Z', source: 'checkpoint', label: 'Mapped billing' },
        { id: '20260915T090000000Z', kind: 'checkpoint', available: true, at: '2026-09-15T09:00:00.000Z', source: 'checkpoint', label: null }
      ])
    })

    it('keeps an unavailable committed baseline in the list with its reason', async () => {
      const setup = changesViewer({ committed: false })
      const viewer = await setup.start()
      viewers.push(viewer)
      const listing = JSON.parse((await get(viewer.url, '/_businesslens/changes')).body)
      expect(listing.baselines).toEqual([
        { id: 'head', kind: 'committed', available: false, reason: expect.stringContaining('not been committed') }
      ])
      const diff = await get(viewer.url, '/_businesslens/changes/diff?base=head')
      expect(diff.status).toBe(422)
      expect(JSON.parse(diff.body).message).toContain('not been committed')
    })

    it('compares the current report against a chosen baseline', async () => {
      const current = fixtureReport()
      current.model.capabilities[0]!.title = 'Renamed capability'
      const setup = changesViewer({ current })
      writeCheckpoint(setup.model, setup.committed, { source: 'checkpoint', now: new Date('2026-09-15T09:00:00.000Z') })
      const viewer = await setup.start()
      viewers.push(viewer)

      for (const base of ['head', '20260915T090000000Z']) {
        const response = await get(viewer.url, `/_businesslens/changes/diff?base=${base}`)
        expect(response.status, base).toBe(200)
        const body = JSON.parse(response.body)
        expect(body.base.id).toBe(base)
        expect(body.diff.counts).toEqual({ added: 0, removed: 0, changed: 1 })
        expect(body.diff.resources[0]).toMatchObject({ collection: 'capabilities', change: 'changed', title: 'Renamed capability' })
      }
      expect((await get(viewer.url, '/_businesslens/changes/diff?base=nope')).status).toBe(422)
      expect((await get(viewer.url, '/_businesslens/changes/diff')).status).toBe(422)
    })

    it('announces a checkpoint sealed by another process', { timeout: WATCH_TEST_TIMEOUT_MS }, async () => {
      const setup = changesViewer()
      const viewer = await setup.start()
      viewers.push(viewer)
      const event = await eventAfter(
        viewer.url,
        'baselines',
        () => { writeCheckpoint(setup.model, setup.committed, { source: 'checkpoint' }) },
        WATCH_TEST_TIMEOUT_MS - 500
      )
      expect(event).toContain('event: baselines')
      const listing = JSON.parse((await get(viewer.url, '/_businesslens/changes')).body)
      expect(listing.baselines.filter((item: { kind: string }) => item.kind === 'checkpoint')).toHaveLength(1)
    })

    it.each([false, true])('announces a commit without a model file edit (existing commit: %s)', { timeout: WATCH_TEST_TIMEOUT_MS }, async (initialCommit) => {
      const root = mkdtempSync(join(tmpdir(), 'businesslens-commit-events-'))
      directories.push(root)
      cpSync(FIXTURE, root, { recursive: true })
      const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim()
      git('init', '--initial-branch=main')
      git('config', 'user.email', 'fixture@example.com')
      git('config', 'user.name', 'Fixture')
      git('add', '.')
      if (initialCommit) git('commit', '-m', 'initial model')
      const file = join(root, '.businesslens', 'capabilities', 'place-order', 'capability.md')
      writeFileSync(file, readFileSync(file, 'utf8').replace(/^# (.*)$/m, '# $1 (edited)'))
      const reference = join(root, 'src', 'services', 'catalog.ts')
      writeFileSync(reference, `${readFileSync(reference, 'utf8')}\n// Reference changed\n`)
      git('add', '.')

      const resolved = resolveModelRoot(root)
      let compileCount = 0
      const viewer = await startLocalViewer({
        viewerRoot: staticViewer(),
        compile: () => { compileCount += 1; return compileResolvedWorkspaceReport(resolved) },
        committed: createCommittedReportSource(resolved),
        referenceRoot: root,
        debounceMs: 10
      })
      viewers.push(viewer)
      const before = JSON.parse((await get(viewer.url, '/_businesslens/changes')).body)
      expect(before.baselines[0].available).toBe(initialCommit)
      if (initialCommit) {
        const comparison = JSON.parse((await get(viewer.url, '/_businesslens/changes/diff?base=head')).body)
        expect(comparison.diff.counts.changed).toBeGreaterThan(1)
        expect(comparison.diff.resources.some((resource: { fields: Array<{ referenceFile?: string }> }) =>
          resource.fields.some(field => field.referenceFile === 'src/services/catalog.ts'))).toBe(true)
      }

      await eventAfter(viewer.url, 'baselines', () => { git('commit', '-m', 'commit current model') }, WATCH_TEST_TIMEOUT_MS - 1000)
      const listing = JSON.parse((await get(viewer.url, '/_businesslens/changes')).body)
      expect(listing.baselines[0]).toMatchObject({ available: true, detail: `${git('rev-parse', '--short=7', 'HEAD')} commit current model` })
      const comparison = JSON.parse((await get(viewer.url, '/_businesslens/changes/diff?base=head')).body)
      expect(comparison.diff).toEqual({ product: [], resources: [], counts: { added: 0, removed: 0, changed: 0 } })
      expect(compileCount).toBe(1)
    })

    it('refreshes file-only edits, deletions and pins without recompiling the model', { timeout: 30_000 }, async () => {
      const root = mkdtempSync(join(tmpdir(), 'businesslens-reference-events-'))
      directories.push(root)
      cpSync(FIXTURE, root, { recursive: true })
      const report = compileReport(loadModel(root), '2026-09-15', root)
      const path = join(root, 'src', 'services', 'catalog.ts')
      const original = readFileSync(path, 'utf8')
      const checkpoint = writeCheckpoint(root, report, { source: 'checkpoint' })
      const checkpointsRoot = ensureCheckpointsDirectory(root)
      let compileCount = 0
      const viewer = await startLocalViewer({
        viewerRoot: staticViewer(),
        compile: () => { compileCount += 1; return report },
        referenceRoot: root,
        checkpointsRoot,
        pin: (report, label) => writeCheckpoint(root, report, { source: 'pin', label })
      })
      viewers.push(viewer)
      const comparison = async (base = checkpoint.id) => JSON.parse((await get(viewer.url, `/_businesslens/changes/diff?base=${base}`)).body)
      const fileFields = (body: Awaited<ReturnType<typeof comparison>>) => body.diff.resources.flatMap((resource: { fields: Array<{ referenceFile?: string }> }) => resource.fields)
        .filter((field: { referenceFile?: string }) => field.referenceFile === 'src/services/catalog.ts')

      await eventAfter(viewer.url, 'references', () => { writeFileSync(path, '// edited source\n') })
      expect(fileFields(await comparison())).toEqual(expect.arrayContaining([expect.objectContaining({ before: original, after: '// edited source\n', change: 'changed' })]))
      await eventAfter(viewer.url, 'references', () => { rmSync(path) })
      expect(fileFields(await comparison())).toEqual(expect.arrayContaining([expect.objectContaining({ before: original, after: null, change: 'removed' })]))
      await eventAfter(viewer.url, 'references', () => { writeFileSync(path, '// recreated\n') })
      const pinned = await fetch(`${viewer.url}/_businesslens/checkpoints`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-businesslens-pin': '1' }, body: '{}'
      })
      expect(pinned.status).toBe(201)
      const { checkpoint: pin } = await pinned.json() as { checkpoint: { id: string } }
      expect((await comparison(pin.id)).diff.resources).toEqual([])

      // An older checkpoint has no evidence of past file contents.
      rmSync(join(checkpointsRoot, `${checkpoint.id}.references.json`))
      const legacy = await comparison()
      expect(legacy.referenceFileNotice).toContain('no local Reference file snapshots')
      expect(legacy.diff.resources).toEqual([])
      expect(compileCount).toBe(1)
    })

    it('pins the current report only from the viewer itself', async () => {
      const setup = changesViewer()
      const viewer = await setup.start()
      viewers.push(viewer)
      const post = (headers: Record<string, string>, body = '{"label":"From the report"}') => fetch(`${viewer.url}/_businesslens/checkpoints`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body
      })

      // A cross-origin page cannot send the custom header without a preflight.
      expect((await post({})).status).toBe(403)
      expect((await post({ 'x-businesslens-pin': '1', 'sec-fetch-site': 'cross-site' })).status).toBe(403)
      expect((await fetch(`${viewer.url}/_businesslens/checkpoints`, { method: 'POST', headers: { 'x-businesslens-pin': '1', 'content-type': 'text/plain' }, body: 'x' })).status).toBe(415)
      expect((await post({ 'x-businesslens-pin': '1' }, '{"label":' + JSON.stringify('x'.repeat(121)) + '}')).status).toBe(422)

      const pinned = await post({ 'x-businesslens-pin': '1', 'sec-fetch-site': 'same-origin' })
      expect(pinned.status).toBe(201)
      const created = await pinned.json() as { checkpoint: { source: string, label: string } }
      expect(created.checkpoint).toMatchObject({ source: 'pin', label: 'From the report' })
      expect(listCheckpoints(setup.checkpointsRoot).map(item => item.label)).toEqual(['From the report'])

      // Other paths still refuse writes.
      expect((await fetch(`${viewer.url}/_businesslens/report.json`, { method: 'POST' })).status).toBe(405)
    })

    it('serves no comparison when the host wires none', async () => {
      const viewer = await startLocalViewer({ viewerRoot: staticViewer(), compile: report })
      viewers.push(viewer)
      expect(JSON.parse((await get(viewer.url, '/_businesslens/changes')).body)).toEqual({ baselines: [] })
      expect((await fetch(`${viewer.url}/_businesslens/checkpoints`, { method: 'POST', headers: { 'x-businesslens-pin': '1', 'content-type': 'application/json' }, body: '{}' })).status).toBe(404)
    })
  })
})
