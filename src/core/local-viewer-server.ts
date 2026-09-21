import { spawn } from 'node:child_process'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { lstatSync, readFileSync, watch, type FSWatcher } from 'node:fs'
import { basename, extname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import type { ProductReportV16 } from './portable.js'
import { MAX_PRODUCT_LOGO_BYTES, validateProductLogo } from '../logo.js'
import { localCodePreview } from './local-code-preview.js'
import { localMarkdownPreview } from './local-markdown-preview.js'

const LOOPBACK_HOST = '127.0.0.1'
const REPORT_PATH = '/_businesslens/report.json'
const EVENTS_PATH = '/_businesslens/events'
const HEALTH_PATH = '/_businesslens/health'
const LOGO_PATH = '/_businesslens/logo.svg'
const ASSET_PREFIX = '/_businesslens/file/'
const CODE_PATH = '/_businesslens/code'
const VIEWER_ROOT = fileURLToPath(new URL('./viewer/', import.meta.url))
const BRAND_ROOT = resolve(createRequire(import.meta.url).resolve('businesslens/package.json'), '../layers/nuxt/theme/public/brand')

/** 25 MB. A product asset is a mockup or a capture, never a build output. */
const MAX_ASSET_BYTES = 25 * 1024 * 1024

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

/**
 * What the repository mount will serve.
 *
 * Reference targets are repository-relative, so the viewer has to reach outside
 * its own bundle to render a mockup or a capture. The allowlist is the guard:
 * inert product material only, never source, never an executable, never a
 * format that scripts when opened. Everything else 404s whether or not it
 * exists, so the mount cannot be used to enumerate a repository.
 * Declared code References use a separate escaped, read-only source preview.
 */
const ASSET_CONTENT_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.md': 'text/markdown; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
}

export interface LocalViewer {
  server: Server
  url: string
  port: number
  /** Compile immediately. Primarily useful to deterministic tests and recovery controls. */
  refresh: () => void
  /** Whether a report is on screen, and otherwise why not. */
  status: () => { ready: boolean, error?: string }
  /**
   * Attach a model after the server is up. A viewer started before
   * `.businesslens/` exists waits with a message; binding gives it what to
   * compile and watch, and the open page comes alive on the next event.
   */
  bind: (binding: LocalViewerBinding) => void
  close: () => Promise<void>
}

/** Everything about one model: what to compile, and where to watch and read. */
export type LocalViewerBinding = Pick<LocalViewerOptions,
  'compile' | 'initialReport' | 'watchRoot' | 'logoFile' | 'assetRoot'>

export interface LocalViewerOptions {
  port?: number
  /** Absent until a model is bound: the viewer then serves the waiting message. */
  compile?: () => ProductReportV16
  /** What `report.json` and the stream say while no model is bound. */
  waitingMessage?: string
  initialReport?: ProductReportV16
  watchRoot?: string
  debounceMs?: number
  viewerRoot?: string
  logoFile?: string
  /**
   * Repository root for the read-only asset mount.
   *
   * Reference targets resolve repository-relative, and product assets live
   * beside the resource they describe, so the viewer serves from the repository
   * rather than only from `.businesslens/`. Omit it and the mount is off.
   */
  assetRoot?: string
}

interface ReportSnapshot {
  report?: ProductReportV16
  error?: string
  revision: number
}

interface ReportEvent {
  type: 'report' | 'compile-error'
  revision: number
  message?: string
}

/**
 * Compile once per source edit and retain the last valid result.
 *
 * Editors commonly save with a rename followed by several writes. Debouncing
 * keeps those intermediate states out of the UI, while retaining the last good
 * report means one temporarily invalid file never blanks the whole viewer.
 */
class LocalReportStore {
  private report?: ProductReportV16
  private serialized?: string
  private error?: string
  private revision = 0
  private timer?: ReturnType<typeof setTimeout>
  private watcher?: FSWatcher
  private readonly listeners = new Set<(event: ReportEvent) => void>()

  constructor(private readonly options: LocalViewerOptions) {
    this.attach()
    if (options.initialReport) this.accept(options.initialReport, false)
    else this.refresh(false)
  }

  /**
   * Bind a model to a running viewer, or rebind one.
   *
   * The request handler reads the same options object, so the logo file and
   * asset root it serves follow the binding too.
   */
  bind(binding: LocalViewerBinding): void {
    this.detach()
    Object.assign(this.options, binding)
    this.attach()
    if (binding.initialReport) this.accept(binding.initialReport, true)
    else this.refresh(true)
  }

  private attach(): void {
    const options = this.options
    if (options.watchRoot) {
      this.watcher = watch(options.watchRoot, { recursive: true }, (_event, filename) => {
        if (!this.isModelSource(filename)) return
        const forceNotify = this.isLogoSource(filename)
        if (this.timer) clearTimeout(this.timer)
        this.timer = setTimeout(
          () => this.refresh(true, forceNotify),
          options.debounceMs ?? 180
        )
      })
      this.watcher.on('error', error => this.reject(`File watching failed: ${error.message}`))
    }
  }

  private detach(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = undefined
    this.watcher?.close()
    this.watcher = undefined
  }

  snapshot(): ReportSnapshot {
    return { report: this.report, error: this.error, revision: this.revision }
  }

  subscribe(listener: (event: ReportEvent) => void): () => void {
    this.listeners.add(listener)
    if (this.error) listener({ type: 'compile-error', revision: this.revision, message: this.error })
    return () => this.listeners.delete(listener)
  }

  refresh(notify = true, forceNotify = false): void {
    const compile = this.options.compile
    if (!compile) {
      this.reject(this.options.waitingMessage ?? 'No Product Model is bound to this viewer yet.', notify)
      return
    }
    try {
      this.accept(compile(), notify, forceNotify)
    } catch (error) {
      this.reject((error as Error).message, notify)
    }
  }

  close(): void {
    this.detach()
    this.listeners.clear()
  }

  private isModelSource(filename: string | Buffer | null): boolean {
    if (filename === null) return true
    const normalized = filename.toString().replaceAll('\\', '/')
    const top = normalized.split('/')[0]
    if (top === 'build' || top === 'cache') return false
    // macOS reports the watched directory's basename for some direct-child
    // changes when recursive mode is enabled, rather than the child filename.
    if (this.options.watchRoot && normalized === basename(this.options.watchRoot)) return true
    // Its presence is a lint error, so adding or removing the retired Coverage
    // file must refresh the report even when no Markdown changes.
    if (normalized === 'coverage.json') return true
    return /\.(?:md|ya?ml|svg)$/i.test(normalized)
  }

  private isLogoSource(filename: string | Buffer | null): boolean {
    if (filename === null) return true
    const normalized = filename.toString().replaceAll('\\', '/')
    return normalized === 'logo.svg'
      || normalized.endsWith('/logo.svg')
      || Boolean(this.options.watchRoot && normalized === basename(this.options.watchRoot))
  }

  private accept(report: ProductReportV16, notify: boolean, forceNotify = false): void {
    const serialized = JSON.stringify(report)
    const recovered = this.error !== undefined
    const changed = serialized !== this.serialized
    this.report = report
    this.serialized = serialized
    this.error = undefined
    if (!notify || (!changed && !recovered && !forceNotify)) return
    this.revision += 1
    this.emit({ type: 'report', revision: this.revision })
  }

  private reject(message: string, notify = true): void {
    if (message === this.error) return
    this.error = message
    if (!notify) return
    this.revision += 1
    this.emit({ type: 'compile-error', revision: this.revision, message })
  }

  private emit(event: ReportEvent): void {
    for (const listener of this.listeners) listener(event)
  }
}

function securityHeaders(response: ServerResponse): void {
  response.setHeader('cache-control', 'no-store')
  response.setHeader(
    'content-security-policy',
    "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https: http:; frame-src 'self'; manifest-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  )
  response.setHeader('cross-origin-resource-policy', 'same-origin')
  response.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()')
  response.setHeader('referrer-policy', 'no-referrer')
  response.setHeader('x-content-type-options', 'nosniff')
  response.setHeader('x-frame-options', 'DENY')
}

function json(response: ServerResponse, status: number, value: unknown, head: boolean): void {
  const body = `${JSON.stringify(value)}\n`
  response.statusCode = status
  response.setHeader('content-type', 'application/json; charset=utf-8')
  response.setHeader('content-length', Buffer.byteLength(body))
  response.end(head ? undefined : body)
}

function productLogo(response: ServerResponse, file: string | undefined, head: boolean): void {
  response.setHeader(
    'content-security-policy',
    "default-src 'none'; script-src 'none'; style-src 'none'; img-src 'none'; connect-src 'none'; sandbox"
  )
  if (!file) {
    json(response, 404, { message: 'This Product Model has no logo.' }, head)
    return
  }
  try {
    const stat = lstatSync(file)
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('The Product logo is not a regular file.')
    if (stat.size > MAX_PRODUCT_LOGO_BYTES) throw new Error('The Product logo is too large.')
    const body = readFileSync(file)
    const issues = validateProductLogo(body)
    if (issues.length) throw new Error(issues.join('; '))
    response.statusCode = 200
    response.setHeader('content-type', 'image/svg+xml; charset=utf-8')
    response.setHeader('content-length', body.byteLength)
    response.end(head ? undefined : body)
  } catch (error) {
    const message = (error as NodeJS.ErrnoException).code === 'ENOENT'
      ? 'This Product Model has no logo.'
      : `The Product logo is invalid: ${(error as Error).message}`
    json(response, (error as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 422, { message }, head)
  }
}

function validHost(request: IncomingMessage, port: number): boolean {
  const host = request.headers.host?.toLowerCase()
  return host === `${LOOPBACK_HOST}:${port}` || host === `localhost:${port}`
}

function staticFile(viewerRoot: string, pathname: string): string | undefined {
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return undefined
  }
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '')
  const root = resolve(viewerRoot)
  const candidate = resolve(root, relative)
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) return undefined
  try {
    const stat = lstatSync(candidate)
    if (!stat.isFile() || stat.isSymbolicLink()) return undefined
  } catch {
    return undefined
  }
  return candidate
}

/**
 * Resolve one repository-relative asset request.
 *
 * Same traversal guard as the bundled viewer, plus an extension allowlist and a
 * size cap. Symlinks are refused so the mount cannot be pointed outside the
 * repository by something committed inside it.
 */
function assetFile(assetRoot: string, pathname: string): string | undefined {
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname.slice(ASSET_PREFIX.length))
  } catch {
    return undefined
  }
  if (!decoded || decoded.startsWith('/')) return undefined
  const root = resolve(assetRoot)
  const candidate = resolve(root, decoded)
  if (!candidate.startsWith(`${root}${sep}`)) return undefined
  if (!(extname(candidate).toLowerCase() in ASSET_CONTENT_TYPES)) return undefined
  try {
    let part = root
    for (const segment of relative(root, candidate).split(sep)) {
      part = resolve(part, segment)
      if (lstatSync(part).isSymbolicLink()) return undefined
    }
    const stat = lstatSync(candidate)
    if (!stat.isFile() || stat.isSymbolicLink()) return undefined
    if (stat.size > MAX_ASSET_BYTES) return undefined
  } catch {
    return undefined
  }
  return candidate
}

function repositoryAsset(response: ServerResponse, file: string, head: boolean): void {
  const extension = extname(file).toLowerCase()
  const body = readFileSync(file)
  if (extension === '.svg') {
    const issues = validateProductLogo(body)
    if (issues.length) {
      json(response, 422, { message: `This SVG is not inert: ${issues.join('; ')}` }, head)
      return
    }
  }
  response.statusCode = 200
  if (extension === '.pdf') {
    response.setHeader('x-frame-options', 'SAMEORIGIN')
    response.setHeader('content-security-policy', "default-src 'none'; script-src 'none'; frame-ancestors 'self'")
  }
  response.setHeader('content-type', ASSET_CONTENT_TYPES[extension] ?? 'application/octet-stream')
  response.setHeader('content-length', body.byteLength)
  response.end(head ? undefined : body)
}

function referencePreview(
  request: IncomingMessage, response: ServerResponse, url: URL, head: boolean,
  preview: () => Promise<{ status: number, data: unknown }>
): void {
  // Direct browser visits open the same reader as references inside the report.
  if (request.headers.accept?.includes('text/html') && !request.headers.accept.includes('application/json')) {
    response.statusCode = 302
    response.setHeader('location', '/?f=' + encodeURIComponent(url.pathname + url.search + (url.pathname === CODE_PATH ? '#reference' : '')))
    response.end()
    return
  }
  void preview().then(result => {
    if (!response.destroyed) json(response, result.status, result.data, head)
  }).catch((error) => {
    if (!response.destroyed) json(response, 404, { message: (error as Error).message || 'This reference could not be rendered.' }, head)
  })
}

function requestHandler(
  options: LocalViewerOptions,
  store: LocalReportStore,
  streams: Set<ServerResponse>,
  port: number
) {
  const viewerRoot = options.viewerRoot ?? VIEWER_ROOT
  return (request: IncomingMessage, response: ServerResponse): void => {
    securityHeaders(response)
    const head = request.method === 'HEAD'
    if (!validHost(request, port)) {
      json(response, 403, { message: 'The local viewer accepts loopback requests only.' }, head)
      return
    }
    const url = new URL(request.url ?? '/', `http://${LOOPBACK_HOST}:${port}`)
    const pathname = url.pathname
    if (request.method !== 'GET' && !head) {
      response.setHeader('allow', 'GET, HEAD')
      json(response, 405, { message: 'Method not allowed.' }, false)
      return
    }

    if (pathname === HEALTH_PATH) {
      json(response, 200, { ok: true }, head)
      return
    }
    if (pathname === REPORT_PATH) {
      const snapshot = store.snapshot()
      if (!snapshot.report) json(response, 422, { message: snapshot.error }, head)
      else {
        response.setHeader('x-businesslens-report-state', snapshot.error ? 'stale' : 'ready')
        json(response, 200, snapshot.report, head)
      }
      return
    }
    if (pathname === LOGO_PATH) {
      productLogo(response, options.logoFile, head)
      return
    }
    if (pathname === CODE_PATH) {
      referencePreview(request, response, url, head, () => localCodePreview(store.snapshot().report, options.assetRoot, url.searchParams.get('target') ?? ''))
      return
    }
    if (pathname.startsWith(ASSET_PREFIX)) {
      const asset = options.assetRoot && assetFile(options.assetRoot, pathname)
      if (!asset) json(response, 404, { message: 'Not found.' }, head)
      else if (extname(asset).toLowerCase() === '.md' && url.searchParams.get('raw') !== '1') {
        referencePreview(request, response, url, head, () => localMarkdownPreview(options.assetRoot!, relative(options.assetRoot!, asset).split(sep).join('/')))
      }
      else repositoryAsset(response, asset, head)
      return
    }
    if (pathname === EVENTS_PATH) {
      if (head) {
        response.statusCode = 200
        response.setHeader('content-type', 'text/event-stream; charset=utf-8')
        response.end()
        return
      }
      response.statusCode = 200
      response.setHeader('content-type', 'text/event-stream; charset=utf-8')
      response.setHeader('connection', 'keep-alive')
      response.flushHeaders()
      response.write(': connected\n\n')
      streams.add(response)
      const unsubscribe = store.subscribe((event) => {
        response.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
      })
      request.once('close', () => {
        unsubscribe()
        streams.delete(response)
      })
      return
    }

    const file = staticFile(viewerRoot, pathname)
      ?? (pathname.startsWith('/brand/') ? staticFile(BRAND_ROOT, pathname.slice('/brand/'.length)) : undefined)
    if (!file) {
      json(response, 404, { message: 'Not found.' }, head)
      return
    }
    const body = readFileSync(file)
    response.statusCode = 200
    response.setHeader('content-type', CONTENT_TYPES[extname(file)] ?? 'application/octet-stream')
    response.setHeader('content-length', body.byteLength)
    response.end(head ? undefined : body)
  }
}

export async function startLocalViewer(options: LocalViewerOptions): Promise<LocalViewer> {
  const requestedPort = options.port ?? 0
  const store = new LocalReportStore(options)
  const streams = new Set<ServerResponse>()
  return await new Promise((resolveViewer, reject) => {
    const server = createServer()
    const onStartError = (error: Error) => {
      store.close()
      reject(error)
    }
    server.once('error', onStartError)
    server.listen(requestedPort, LOOPBACK_HOST, () => {
      server.removeListener('error', onStartError)
      const address = server.address()
      if (!address || typeof address === 'string') {
        store.close()
        server.close()
        reject(new Error('The local viewer did not receive a TCP port.'))
        return
      }
      const port = address.port
      server.on('request', requestHandler(options, store, streams, port))
      resolveViewer({
        server,
        port,
        url: `http://${LOOPBACK_HOST}:${port}`,
        refresh: () => store.refresh(),
        status: () => {
          const snapshot = store.snapshot()
          return { ready: Boolean(snapshot.report), error: snapshot.error }
        },
        bind: binding => store.bind(binding),
        close: () => new Promise<void>((resolveClose, rejectClose) => {
          store.close()
          for (const stream of streams) stream.end()
          streams.clear()
          server.close(error => error ? rejectClose(error) : resolveClose())
        })
      })
    })
  })
}

export function openBrowser(url: string): void {
  const command = process.platform === 'darwin'
    ? { file: 'open', args: [url] }
    : process.platform === 'win32'
      ? { file: 'cmd', args: ['/c', 'start', '', url] }
      : { file: 'xdg-open', args: [url] }
  const child = spawn(command.file, command.args, {
    detached: true,
    stdio: 'ignore'
  })
  child.on('error', () => {})
  child.unref()
}
