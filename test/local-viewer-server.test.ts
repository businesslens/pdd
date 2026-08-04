import { request } from 'node:http'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { startLocalViewer, type LocalViewer } from '../src/core/local-viewer-server.js'
import type { ProductReportV7 } from '../src/core/portable.js'

interface ResponseResult {
  body: string
  headers: Record<string, string | string[] | undefined>
  status: number
}

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

function eventAfter(url: string, eventName: string, trigger: () => void): Promise<string> {
  const origin = new URL(url)
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${eventName}`)), 3000)
    const outgoing = request({
      hostname: origin.hostname,
      port: origin.port,
      path: '/_businesslens/events',
      method: 'GET'
    }, (incoming) => {
      let body = ''
      incoming.setEncoding('utf8')
      incoming.on('data', (chunk) => {
        body += chunk
        if (!body.includes(`event: ${eventName}\n`)) return
        clearTimeout(timeout)
        incoming.destroy()
        resolve(body)
      })
      trigger()
    })
    outgoing.on('error', reject)
    outgoing.end()
  })
}

async function eventually<T>(read: () => Promise<T>, matches: (value: T) => boolean): Promise<T> {
  const deadline = Date.now() + 3000
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

function report(): ProductReportV7 {
  return { id: 'fixture-shop', title: 'Fixture Shop' } as ProductReportV7
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
    expect(productLogo.body).toContain('<svg')

    const manifest = await get(viewer.url, '/site.webmanifest')
    expect(manifest.status).toBe(200)
    expect(manifest.headers['content-type']).toBe('application/manifest+json; charset=utf-8')
  })

  it('watches model sources and announces a new report over server-sent events', async () => {
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

    const event = eventAfter(viewer.url, 'report', () => writeFileSync(product, 'Updated title'))
    const updated = await eventually(
      () => get(viewer.url, '/_businesslens/report.json'),
      response => JSON.parse(response.body).title === 'Updated title'
    )

    expect(JSON.parse(updated.body).title).toBe('Updated title')
    expect(await event).toContain('"revision":1')
  })

  it('announces a valid logo edit even when the semantic report is unchanged', async () => {
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

    const event = eventAfter(viewer.url, 'report', () => writeFileSync(logoFile, logo('#b8965c')))
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
})
