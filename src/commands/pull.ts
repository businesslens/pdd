import { parseCanonicalName } from '../core/canonical-name.js'
import { resolveCatalogUrl } from '../core/catalog-url.js'
import { reportDigest } from '../core/report-digest.js'
import { cliVersion } from '../version.js'
import { expandProductReport } from './open.js'
import { UsageError } from '../core/usage-error.js'
import { MAX_PRODUCT_LOGO_BYTES, validateProductLogo } from '../logo.js'

const MAX_REPORT_BYTES = 8 * 1024 * 1024

export interface PullOptions {
  catalog?: string
  force: boolean
}

export interface PullDependencies {
  fetch: typeof globalThis.fetch
  env: NodeJS.ProcessEnv
}

async function readLimitedBytes(response: Response, limit: number, message: string): Promise<Uint8Array> {
  if (!response.body) return new Uint8Array()
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > limit) {
      await reader.cancel()
      throw new Error(message)
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

function catalogError(status: number, body: string): string {
  let detail = ''
  try {
    const payload = JSON.parse(body) as Record<string, unknown>
    detail = typeof payload.message === 'string'
      ? payload.message
      : typeof payload.statusMessage === 'string'
        ? payload.statusMessage
        : ''
  } catch {
    // Do not surface arbitrary HTML or proxy bodies.
  }
  const friendly: Record<number, string> = {
    404: 'No such Blueprint in the catalog.',
    410: 'That Blueprint has been withdrawn from the catalog.',
    503: 'The catalog is temporarily unavailable. Try again shortly.'
  }
  const base = friendly[status] || `Blueprint pull failed with status ${status}.`
  return detail && !base.includes(detail) ? `${base} ${detail}` : base
}

async function fetchOptionalLogo(
  fetch: typeof globalThis.fetch,
  catalog: string,
  blueprint: string
): Promise<Uint8Array | undefined> {
  try {
    const response = await fetch(
      `${catalog}/api/v1/blueprints/${blueprint}/logo.svg`,
      {
        headers: {
          accept: 'image/svg+xml',
          'user-agent': `businesslens/${cliVersion()}`
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(15_000)
      }
    )
    if (!response.ok || (response.status >= 300 && response.status < 400)) return undefined
    const length = Number(response.headers.get('content-length') || 0)
    if (length > MAX_PRODUCT_LOGO_BYTES) return undefined
    const logo = await readLimitedBytes(
      response,
      MAX_PRODUCT_LOGO_BYTES,
      'The Product logo exceeds the 256 KiB safety limit.'
    )
    return validateProductLogo(logo).length ? undefined : logo
  } catch {
    return undefined
  }
}

export async function runPull(
  cwd: string,
  name: string,
  options: PullOptions,
  dependencies: Partial<PullDependencies> = {}
): Promise<number> {
  let parsedName: string
  let catalog: string
  try {
    parsedName = parseCanonicalName(name)
    catalog = resolveCatalogUrl(options.catalog, dependencies.env ?? process.env)
  } catch (error) {
    console.error((error as Error).message)
    return error instanceof UsageError ? 2 : 1
  }

  const blueprint = encodeURIComponent(parsedName)
  const url = `${catalog}/api/v1/blueprints/${blueprint}/report.json`
  const fetch = dependencies.fetch ?? globalThis.fetch

  let response: Response
  let body: string
  try {
    response = await fetch(url, {
      headers: {
        accept: 'application/vnd.businesslens.report+json; version=9, application/json',
        // Identify the CLI so catalog pulls are distinguishable from browser
        // fetches. Without it every pull is indistinguishable from a page view.
        'user-agent': `businesslens/${cliVersion()}`
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000)
    })
    if (response.status >= 300 && response.status < 400) {
      throw new Error('Refusing a redirected Blueprint report response.')
    }
    const length = Number(response.headers.get('content-length') || 0)
    if (length > MAX_REPORT_BYTES) {
      throw new Error('The Blueprint report exceeds the 8 MiB safety limit.')
    }
    body = new TextDecoder().decode(await readLimitedBytes(
      response,
      MAX_REPORT_BYTES,
      'The Blueprint report exceeds the 8 MiB safety limit.'
    ))
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }

  if (!response.ok) {
    console.error(catalogError(response.status, body))
    return 1
  }

  const contentType = response.headers.get('content-type') || ''
  if (
    !contentType.includes('application/vnd.businesslens.report+json')
    && !contentType.includes('application/json')
  ) {
    console.error('The catalog returned an unexpected Blueprint report content type.')
    return 1
  }

  const expectedDigest = response.headers.get('x-businesslens-report-digest')
  const returnedName = response.headers.get('x-businesslens-blueprint')
  if (!expectedDigest || !/^[a-f0-9]{64}$/i.test(expectedDigest)) {
    console.error('The catalog did not provide a valid Blueprint report digest.')
    return 1
  }
  if (returnedName !== parsedName) {
    console.error('The catalog returned a report for a different Blueprint.')
    return 1
  }

  let report: unknown
  try {
    report = JSON.parse(body)
  } catch {
    console.error('The catalog returned invalid Blueprint report JSON.')
    return 1
  }
  if (reportDigest(report) !== expectedDigest.toLowerCase()) {
    console.error('The Blueprint report digest does not match the catalog response.')
    return 1
  }

  const logo = await fetchOptionalLogo(fetch, catalog, blueprint)

  try {
    const opened = expandProductReport(cwd, report, options.force, logo ? { logo } : {})
    console.log(`Pulled ${parsedName} into ${opened.root}.`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
}
