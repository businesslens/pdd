import { readCredentials } from '../core/credentials.js'
import { reportDigest } from '../core/report-digest.js'
import { expandProductReport } from './open.js'

const MAX_REPORT_BYTES = 8 * 1024 * 1024
const CANONICAL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface PullOptions {
  version?: number
  force: boolean
}

export interface PullDependencies {
  fetch: typeof globalThis.fetch
  configDir?: string
}

class PullUsageError extends Error {}

function parseCanonicalName(value: string): string {
  if (!CANONICAL_NAME.test(value) || value.length > 80) {
    throw new PullUsageError(
      'Blueprint name must be its lowercase kebab-case canonical name.'
    )
  }
  return value
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

function platformError(status: number, body: string): string {
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
    401: 'BusinessLens CLI login is missing or expired. Run `businesslens login` again.',
    403: 'Your BusinessLens account cannot access this Blueprint.',
    404: 'The requested Blueprint or version was not found.',
    410: 'The requested Blueprint version has been withdrawn.'
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
  let parsedName: ReturnType<typeof parseCanonicalName>
  try {
    parsedName = parseCanonicalName(name)
    if (
      options.version !== undefined
      && (!Number.isSafeInteger(options.version) || options.version <= 0)
    ) {
      throw new PullUsageError('--version must be a positive integer.')
    }
  } catch (error) {
    console.error((error as Error).message)
    return error instanceof PullUsageError ? 2 : 1
  }

  let credentials
  try {
    credentials = readCredentials(dependencies.configDir)
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }

  const blueprint = encodeURIComponent(parsedName)
  const versionPath = options.version === undefined ? '' : `/releases/${options.version}`
  const url = `${credentials.platformUrl}/api/v1/hub/blueprints/${blueprint}${versionPath}/report.json`

  let response: Response
  let body: string
  try {
    response = await (dependencies.fetch ?? globalThis.fetch)(url, {
      headers: {
        accept: 'application/vnd.businesslens.report+json; version=4, application/json',
        authorization: `Bearer ${credentials.accessToken}`
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
    console.error(platformError(response.status, body))
    return 1
  }

  const contentType = response.headers.get('content-type') || ''
  if (
    !contentType.includes('application/vnd.businesslens.report+json')
    && !contentType.includes('application/json')
  ) {
    console.error('The Platform returned an unexpected Blueprint report content type.')
    return 1
  }

  const expectedDigest = response.headers.get('x-businesslens-report-digest')
  const returnedName = response.headers.get('x-businesslens-blueprint')
  const returnedVersion = Number(response.headers.get('x-businesslens-revision'))
  if (!expectedDigest || !/^[a-f0-9]{64}$/i.test(expectedDigest)) {
    console.error('The Platform did not provide a valid Blueprint report digest.')
    return 1
  }
  if (returnedName !== parsedName) {
    console.error('The Platform returned a report for a different Blueprint.')
    return 1
  }
  if (!Number.isSafeInteger(returnedVersion) || returnedVersion <= 0) {
    console.error('The Platform did not identify the resolved Blueprint version.')
    return 1
  }
  if (options.version !== undefined && returnedVersion !== options.version) {
    console.error('The Platform returned a different Blueprint version than requested.')
    return 1
  }

  let report: unknown
  try {
    report = JSON.parse(body)
  } catch {
    console.error('The Platform returned invalid Blueprint report JSON.')
    return 1
  }
  if (reportDigest(report) !== expectedDigest.toLowerCase()) {
    console.error('The Blueprint report digest does not match the Platform response.')
    return 1
  }

  try {
    const opened = expandProductReport(cwd, report, options.force)
    console.log(
      `Pulled ${parsedName} version ${returnedVersion} into ${opened.root}.`
    )
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
}
