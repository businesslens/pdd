import { spawn } from 'node:child_process'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { lstatSync, readFileSync, watch, type FSWatcher } from 'node:fs'
import { basename, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import type { ProductReportV13 } from './portable.js'
import { MAX_PRODUCT_LOGO_BYTES, validateProductLogo } from '../logo.js'
import { listCheckpoints, normalizeCheckpointLabel, readCheckpoint, type CheckpointMeta, type CommittedReport } from './checkpoints.js'
import { diffReports, type ReportBaseline, type ReportDiff } from './report-diff.js'
import { createReferenceFileSource } from './reference-files.js'
import type { ReportReferenceFiles } from './report-reference-files.js'

const LOOPBACK_HOST = '127.0.0.1'
const REPORT_PATH = '/_businesslens/report.json'
const EVENTS_PATH = '/_businesslens/events'
const HEALTH_PATH = '/_businesslens/health'
const LOGO_PATH = '/_businesslens/logo.svg'
const CHANGES_PATH = '/_businesslens/changes'
const CHANGES_DIFF_PATH = '/_businesslens/changes/diff'
const CHECKPOINTS_PATH = '/_businesslens/checkpoints'
const PIN_HEADER = 'x-businesslens-pin'
const MAX_PIN_BODY_BYTES = 4096
const ASSET_PREFIX = '/_businesslens/file/'
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
  'compile' | 'initialReport' | 'watchRoot' | 'logoFile' | 'assetRoot' | 'referenceRoot' | 'checkpointsRoot' | 'committed' | 'pin'>

export interface LocalViewerOptions {
  port?: number
  /** Absent until a model is bound: the viewer then serves the waiting message. */
  compile?: () => ProductReportV13
  /** What `report.json` and the stream say while no model is bound. */
  waitingMessage?: string
  initialReport?: ProductReportV13
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
  /** Root for local Reference file comparisons, including code and documents. */
  referenceRoot?: string
  /**
   * Directory holding sealed checkpoints. It is watched, so a `checkpoint` run in
   * another terminal reaches every open viewer. Omit it and there are none.
   */
  checkpointsRoot?: string
  /** The model at the last commit; throws with a reason when there is none. */
  committed?: () => CommittedReport
  /** Seal the current report from the viewer's pin. Omit it and pinning is off. */
  pin?: (report: ProductReportV13, label: string | null) => CheckpointMeta | undefined
}

interface ReportSnapshot {
  report?: ProductReportV13
  error?: string
  revision: number
}

interface ReportEvent {
  type: 'report' | 'compile-error' | 'baselines' | 'references'
  revision: number
  message?: string
}

/** What `/_businesslens/changes` answers: every baseline a comparison can use. */
export interface ReportChangesListing {
  baselines: ReportBaseline[]
}

/** What `/_businesslens/changes/diff` answers for one baseline. */
export interface ReportChangesDiff {
  base: ReportBaseline
  diff: ReportDiff
  /** The report revision the comparison was made against. */
  revision: number
  /** Missing snapshots or unreadable files must not look like a complete comparison. */
  referenceFileNotice?: string
}

/**
 * Compile once per source edit and retain the last valid result.
 *
 * Editors commonly save with a rename followed by several writes. Debouncing
 * keeps those intermediate states out of the UI, while retaining the last good
 * report means one temporarily invalid file never blanks the whole viewer.
 */
class LocalReportStore {
  private report?: ProductReportV13
  private serialized?: string
  private error?: string
  private revision = 0
  private timer?: ReturnType<typeof setTimeout>
  private baselineTimer?: ReturnType<typeof setTimeout>
  private committedTimer?: ReturnType<typeof setInterval>
  private referenceTimer?: ReturnType<typeof setInterval>
  private referenceFiles?: ReportReferenceFiles
  private referenceRevision?: string
  private readReferenceFiles?: (report: ProductReportV13) => ReportReferenceFiles
  private watcher?: FSWatcher
  private checkpointWatcher?: FSWatcher
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
    if (options.referenceRoot) this.readReferenceFiles = createReferenceFileSource(options.referenceRoot)

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

    /* Checkpoints arrive from another process — a `checkpoint` in the agent's
       terminal — so they are watched separately from the model sources, and
       announced without recompiling anything. */
    if (options.checkpointsRoot) {
      try {
        this.checkpointWatcher = watch(options.checkpointsRoot, (_event, filename) => {
          if (filename && !filename.toString().endsWith('.json')) return
          this.announceBaselines()
        })
        this.checkpointWatcher.on('error', () => { /* Checkpoints still list on request. */ })
      } catch { /* A missing directory means no checkpoints yet. */ }
    }

    /* Commits need not touch any model source. Poll the cached source, which
       checks HEAD and recompiles only when it moves. This also covers packed
       refs, linked worktrees and the first commit without watching Git internals. */
    if (options.committed) {
      const committed = options.committed
      const readRevision = () => {
        try { return committed().commit }
        catch (error) { return `unavailable:${(error as Error).message}` }
      }
      let revision = readRevision()
      this.committedTimer = setInterval(() => {
        const next = readRevision()
        if (next === revision) return
        revision = next
        this.announceBaselines()
      }, 1000)
      this.committedTimer.unref()
    }
    // Only referenced paths are polled. This covers files outside the model,
    // binary assets and atomic replacements without watching the entire repo.
    if (this.readReferenceFiles) {
      this.referenceTimer = setInterval(() => this.refreshReferences(), 1000)
      this.referenceTimer.unref()
    }
  }

  private detach(): void {
    if (this.timer) clearTimeout(this.timer)
    if (this.baselineTimer) clearTimeout(this.baselineTimer)
    if (this.committedTimer) clearInterval(this.committedTimer)
    if (this.referenceTimer) clearInterval(this.referenceTimer)
    this.timer = this.baselineTimer = this.committedTimer = this.referenceTimer = undefined
    this.watcher?.close()
    this.checkpointWatcher?.close()
    this.watcher = this.checkpointWatcher = undefined
    this.readReferenceFiles = undefined
    this.referenceFiles = undefined
    this.referenceRevision = undefined
  }

  snapshot(): ReportSnapshot {
    return { report: this.report, error: this.error, revision: this.revision }
  }

  /** Every baseline a comparison can be made against, committed first, then checkpoints newest first. */
  baselines(): ReportBaseline[] {
    const list: ReportBaseline[] = []
    if (this.options.committed) {
      try {
        const committed = this.options.committed()
        list.push({
          id: 'head',
          kind: 'committed',
          available: true,
          at: committed.committedAt,
          detail: `${committed.commit.slice(0, 7)} ${committed.subject}`.trim()
        })
      } catch (error) {
        list.push({ id: 'head', kind: 'committed', available: false, reason: (error as Error).message })
      }
    }
    if (this.options.checkpointsRoot) {
      for (const meta of listCheckpoints(this.options.checkpointsRoot)) {
        list.push({ id: meta.id, kind: 'checkpoint', available: true, at: meta.at, source: meta.source, label: meta.label })
      }
    }
    return list
  }

  /** The current report against one baseline, or the reason there is no comparison. */
  changes(base: string): { ok: true, value: ReportChangesDiff } | { ok: false, message: string } {
    if (!this.report) return { ok: false, message: this.error ?? 'The Product Model has not compiled yet.' }
    const baseline = this.baselines().find(item => item.id === base)
    if (!baseline) return { ok: false, message: 'That baseline is not available.' }
    if (!baseline.available) return { ok: false, message: baseline.reason }
    const before = baseline.kind === 'committed'
      ? this.options.committed!()
      : readCheckpoint(this.options.checkpointsRoot!, baseline.id)
    if (!before) return { ok: false, message: 'That checkpoint could not be read.' }
    this.refreshReferences()
    const files = before.referenceFiles && this.referenceFiles ? { before: before.referenceFiles, after: this.referenceFiles } : undefined
    let referenceFileNotice: string | undefined
    if (this.referenceFiles && !before.referenceFiles) {
      referenceFileNotice = 'This baseline has no local Reference file snapshots. Only model fields are compared; pin this state to compare later file edits.'
    } else if (files) {
      const unreadable = [...new Set([files.before, files.after].flatMap(snapshot => Object.entries(snapshot)
        .flatMap(([path, file]) => file.status === 'unavailable' ? [`${path}: ${file.reason}`] : [])))]
      if (unreadable.length) referenceFileNotice = `Some local Reference files could not be compared:\n${unreadable.join('\n')}`
    }
    return { ok: true, value: { base: baseline, diff: diffReports(before.report, this.report, files), revision: this.revision, referenceFileNotice } }
  }

  /** Seal the current report from the viewer. */
  pin(label: string | null): { ok: true, checkpoint: CheckpointMeta } | { ok: false, status: number, message: string } {
    if (!this.options.pin) return { ok: false, status: 404, message: 'Not found.' }
    if (!this.report) return { ok: false, status: 422, message: this.error ?? 'The Product Model has not compiled yet.' }
    try {
      const checkpoint = this.options.pin(this.report, label)
      if (!checkpoint) return { ok: false, status: 422, message: 'Nothing was sealed.' }
      this.announceBaselines()
      return { ok: true, checkpoint }
    } catch (error) {
      return { ok: false, status: 422, message: (error as Error).message }
    }
  }

  private announceBaselines(): void {
    if (this.baselineTimer) clearTimeout(this.baselineTimer)
    this.baselineTimer = setTimeout(
      () => this.emit({ type: 'baselines', revision: this.revision }),
      this.options.debounceMs ?? 180
    )
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
    return /\.(?:md|ya?ml|svg)$/i.test(normalized)
  }

  private isLogoSource(filename: string | Buffer | null): boolean {
    if (filename === null) return true
    const normalized = filename.toString().replaceAll('\\', '/')
    return normalized === 'logo.svg'
      || normalized.endsWith('/logo.svg')
      || Boolean(this.options.watchRoot && normalized === basename(this.options.watchRoot))
  }

  private accept(report: ProductReportV13, notify: boolean, forceNotify = false): void {
    const serialized = JSON.stringify(report)
    const recovered = this.error !== undefined
    const changed = serialized !== this.serialized
    this.report = report
    this.refreshReferences(false)
    this.serialized = serialized
    this.error = undefined
    if (!notify || (!changed && !recovered && !forceNotify)) return
    this.revision += 1
    this.emit({ type: 'report', revision: this.revision })
  }

  private refreshReferences(notify = true): void {
    if (!this.report || !this.readReferenceFiles) return
    const files = this.readReferenceFiles(this.report)
    // Content is cached separately; the revision only needs fingerprints and failures.
    const revision = JSON.stringify(Object.entries(files).map(([path, file]) =>
      [path, file.status === 'present' ? file.digest : file]))
    const changed = revision !== this.referenceRevision
    this.referenceFiles = files
    this.referenceRevision = revision
    if (changed && notify) {
      this.revision += 1
      this.emit({ type: 'references', revision: this.revision })
    }
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
    "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; manifest-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
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
  response.setHeader('content-type', ASSET_CONTENT_TYPES[extension] ?? 'application/octet-stream')
  response.setHeader('content-length', body.byteLength)
  response.end(head ? undefined : body)
}

/**
 * The one write the viewer can make: seal the report it is showing.
 *
 * A page on any origin can POST to localhost, and the Host header alone does
 * not tell them apart. Two guards make the request one only the viewer's own
 * script can send: a custom header, which forces a cross-origin page through
 * a preflight the server never answers, and the browser's own fetch metadata
 * where it sends it.
 */
function pinCheckpoint(request: IncomingMessage, response: ServerResponse, store: LocalReportStore): void {
  const site = request.headers['sec-fetch-site']
  if (site && site !== 'same-origin' && site !== 'none') {
    json(response, 403, { message: 'Checkpoints are pinned from the local viewer only.' }, false)
    return
  }
  if (!request.headers[PIN_HEADER]) {
    json(response, 403, { message: 'Checkpoints are pinned from the local viewer only.' }, false)
    return
  }
  if (!String(request.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
    json(response, 415, { message: 'A pin is a JSON body.' }, false)
    return
  }
  const chunks: Buffer[] = []
  let size = 0
  let refused = false
  request.on('data', (chunk: Buffer) => {
    if (refused) return
    size += chunk.byteLength
    if (size > MAX_PIN_BODY_BYTES) {
      refused = true
      json(response, 413, { message: 'A pin label is short.' }, false)
      request.destroy()
      return
    }
    chunks.push(Buffer.from(chunk))
  })
  request.on('end', () => {
    if (refused) return
    let label: string | null
    try {
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) as { label?: unknown } : {}
      if (body.label !== undefined && body.label !== null && typeof body.label !== 'string') throw new Error('The label is text.')
      label = normalizeCheckpointLabel(body.label as string | null | undefined)
    } catch (error) {
      json(response, 422, { message: (error as Error).message }, false)
      return
    }
    const result = store.pin(label)
    if (result.ok) json(response, 201, { checkpoint: result.checkpoint }, false)
    else json(response, result.status, { message: result.message }, false)
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
    if (request.method === 'POST' && pathname === CHECKPOINTS_PATH) {
      pinCheckpoint(request, response, store)
      return
    }
    if (request.method !== 'GET' && !head) {
      response.setHeader('allow', 'GET, HEAD')
      json(response, 405, { message: 'Method not allowed.' }, false)
      return
    }

    if (pathname === HEALTH_PATH) {
      json(response, 200, { ok: true }, head)
      return
    }
    if (pathname === CHANGES_PATH) {
      json(response, 200, { baselines: store.baselines() } satisfies ReportChangesListing, head)
      return
    }
    if (pathname === CHANGES_DIFF_PATH) {
      const result = store.changes(url.searchParams.get('base') ?? '')
      if (result.ok) json(response, 200, result.value, head)
      else json(response, 422, { message: result.message }, head)
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
    if (pathname.startsWith(ASSET_PREFIX)) {
      const asset = options.assetRoot && assetFile(options.assetRoot, pathname)
      if (!asset) json(response, 404, { message: 'Not found.' }, head)
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
