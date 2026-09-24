import { request } from 'node:http'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { startLocalViewer, type LocalViewer } from '../src/core/local-viewer-server.js'
import type { ProductReportV14 } from '../src/core/portable.js'

// A preview that throws is a server fault, whatever the error says.
vi.mock('../src/core/local-markdown-preview.js', () => ({
  localMarkdownPreview: async () => {
    throw new Error("EACCES: permission denied, open '/Users/someone/private/notes.md'")
  }
}))

const directories: string[] = []
const viewers: LocalViewer[] = []

afterEach(async () => {
  await Promise.all(viewers.splice(0).map(viewer => viewer.close()))
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

function scratch(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  directories.push(directory)
  return directory
}

function get(url: string, path: string): Promise<{ status: number, body: string }> {
  const origin = new URL(url)
  return new Promise((resolve, reject) => {
    const outgoing = request({ hostname: origin.hostname, port: origin.port, path, method: 'GET' }, (incoming) => {
      const chunks: Buffer[] = []
      incoming.on('data', chunk => chunks.push(Buffer.from(chunk)))
      incoming.on('end', () => resolve({ status: incoming.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') }))
    })
    outgoing.on('error', reject)
    outgoing.end()
  })
}

describe('local reference previews', () => {
  it('answers a failed preview as a generic server error without its raw text', async () => {
    const viewerRoot = scratch('businesslens-viewer-')
    writeFileSync(join(viewerRoot, 'index.html'), '<!doctype html><title>Local Product Model</title>')
    const repository = scratch('businesslens-preview-errors-')
    mkdirSync(join(repository, 'docs'))
    writeFileSync(join(repository, 'docs', 'notes.md'), '# Notes')

    const viewer = await startLocalViewer({
      viewerRoot,
      compile: () => ({ id: 'fixture-shop', title: 'Fixture Shop' }) as ProductReportV14,
      assetRoot: repository
    })
    viewers.push(viewer)

    const response = await get(viewer.url, '/_businesslens/file/docs/notes.md')
    expect(response.status).toBe(500)
    expect(JSON.parse(response.body)).toEqual({ message: 'This reference could not be rendered.' })
    expect(response.body).not.toContain('/Users/')
  })
})
