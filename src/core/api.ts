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
  } catch {
    // non-JSON error body — fall through to status mapping
  }
  const friendly: Record<number, string> = {
    401: 'The platform rejected the API key. Check BUSINESSLENS_API_KEY.',
    403: 'This API key cannot submit projects. Create a workspace project key.',
    409: 'The submission conflicts with the existing project.',
    400: 'The project payload was rejected.'
  }
  const base = friendly[response.status] || `Platform request failed with status ${response.status}.`
  const suffix = issues.length ? `\n- ${issues.join('\n- ')}` : detail ? ` ${detail}` : ''
  throw new PlatformApiError(`${base}${suffix}`, response.status)
}

export async function submitProject(
  options: ApiClientOptions,
  project: PortableProjectV3
): Promise<{ href: string, versionKey: string }> {
  return post(options, '/api/v3/projects', {
    target: { projectSlug: project.id },
    project
  })
}
