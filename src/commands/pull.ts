import { writeGreenfieldAgentBlock } from '../core/agent-block.js'
import { CanonicalNameError, parseCanonicalName } from '../core/canonical-name.js'
import { resolveCatalogUrl } from '../core/catalog-url.js'
import { reportDigest } from '../core/report-digest.js'
import { cliVersion } from '../version.js'
import { expandProductReport } from './open.js'

const MAX_REPORT_BYTES = 8 * 1024 * 1024

export interface PullOptions {
  catalog?: string
  force: boolean
}

export interface PullDependencies {
  fetch: typeof globalThis.fetch
  env: NodeJS.ProcessEnv
}

async function readLimitedBody(response: Response): Promise<string> {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_REPORT_BYTES) {
      await reader.cancel()
      throw new Error('The Blueprint report exceeds the 8 MiB safety limit.')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
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
    return error instanceof CanonicalNameError ? 2 : 1
  }

  const blueprint = encodeURIComponent(parsedName)
  const url = `${catalog}/api/v1/blueprints/${blueprint}/report.json`

  let response: Response
  let body: string
  try {
    response = await (dependencies.fetch ?? globalThis.fetch)(url, {
      headers: {
        accept: 'application/vnd.businesslens.report+json; version=4, application/json',
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
    body = await readLimitedBody(response)
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

  try {
    const opened = expandProductReport(cwd, report, options.force)
    // A pulled Blueprint has no implementation, so it arrives with nothing
    // telling an agent what it is. This is what makes "hand it to your agent"
    // work without the user inventing the prompt.
    const agentsFile = writeGreenfieldAgentBlock(cwd)
    console.log(`Pulled ${parsedName} into ${opened.root}.`)
    console.log(`Wrote the greenfield agent block to ${agentsFile}.`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
}
