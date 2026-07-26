import type { PortableProjectV3 } from './portable.js'

export interface ApiClientOptions {
  baseUrl: string
  apiKey: string
}

export class PlatformApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

async function post(options: ApiClientOptions, path: string, body: unknown): Promise<any> {
  const response = await fetch(`${options.baseUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${options.apiKey}`
    },
    body: JSON.stringify(body)
  })
  if (response.ok) return response.json()
  let detail = ''
  let issues: string[] = []
  try {
    const payload = await response.json() as Record<string, any>
    detail = payload?.message || ''
    if (Array.isArray(payload?.data?.issues)) issues = payload.data.issues
    if (payload?.data?.expectedBranch) {
      detail += ` (project tracks branch "${payload.data.expectedBranch}", you submitted "${payload.data.submittedBranch}")`
    }
  } catch {
    // non-JSON error body — fall through to status mapping
  }
  const friendly: Record<number, string> = {
    401: 'The platform rejected the API key. Check BUSINESSLENS_API_KEY.',
    403: 'This API key cannot submit projects. Create a workspace project key.',
    404: 'The analysis was not found. Re-run publish to start a fresh one.',
    409: 'The submission conflicts with the existing project.',
    400: 'The project payload was rejected.'
  }
  const base = friendly[response.status] || `Platform request failed with status ${response.status}.`
  const suffix = issues.length ? `\n- ${issues.join('\n- ')}` : detail ? ` ${detail}` : ''
  throw new PlatformApiError(`${base}${suffix}`, response.status)
}

export interface StartAnalysisInput {
  clientRunId: string
  repository: { name: string, url: string, branch: string }
  revision: { commit: string, committedAt: string }
  generator: { name: string, version: string }
}

export async function startAnalysis(options: ApiClientOptions, input: StartAnalysisInput): Promise<{ analysisId: string, href: string }> {
  return post(options, '/api/v2/analyses', input)
}

export async function recordEvent(
  options: ApiClientOptions,
  analysisId: string,
  event: { clientEventId: string, phase: string, message: string, metrics?: Record<string, number> }
): Promise<void> {
  await post(options, `/api/v2/analyses/${analysisId}/events`, { analysisId, ...event })
}

export async function submitProject(
  options: ApiClientOptions,
  analysisId: string,
  project: PortableProjectV3
): Promise<{ href: string, created: boolean, versionKey: string }> {
  return post(options, '/api/v2/projects', { analysisId, project })
}
