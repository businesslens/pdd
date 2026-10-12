import { z } from 'zod'
import { cliVersion } from '../version.js'
import { CANONICAL_NAME, CANONICAL_NAME_MAX_LENGTH } from './canonical-name.js'
import { REPORT_SCHEMA_VERSION } from './portable.js'
import { UsageError } from './usage-error.js'

/**
 * Where Blueprints are published and contributed.
 *
 * Blueprints live in `blueprints/` of this repository. Every merge to `main`
 * rebuilds them into one rolling GitHub Release per report major, so a merged
 * Blueprint can be pulled without a CLI release and without a server.
 */
export const DEFAULT_BLUEPRINT_REPOSITORY = 'itai-gendler/pdd-kit'

/** The report major this CLI reads, and the only one it asks a release for. */
export const REPORT_MAJOR = REPORT_SCHEMA_VERSION.split('.')[0]!

/** One release per report major, so an older CLI keeps reading its own. */
export const BLUEPRINT_RELEASE_TAG = `blueprints-v${REPORT_MAJOR}`

export const BLUEPRINT_INDEX_FILE = 'index.json'

const MAX_INDEX_BYTES = 1024 * 1024
const ASSET_NAME = /^[a-z0-9][a-z0-9.-]*$/
const REPOSITORY = /^[\w.-]+\/[\w.-]+$/

/**
 * The repository Blueprints are pulled from and contributed to.
 *
 * `PDD_KIT_BLUEPRINT_REPOSITORY` overrides it for a fork, and applies to
 * pull, list and contribute alike so the three cannot point at different places.
 */
export function resolveBlueprintRepository(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.PDD_KIT_BLUEPRINT_REPOSITORY?.trim()
  if (!configured) return DEFAULT_BLUEPRINT_REPOSITORY
  if (!REPOSITORY.test(configured)) {
    throw new UsageError('PDD_KIT_BLUEPRINT_REPOSITORY must be an "owner/repo" pair.')
  }
  return configured
}

export function blueprintAssetUrl(repository: string, file: string): string {
  return `https://github.com/${repository}/releases/download/${BLUEPRINT_RELEASE_TAG}/${encodeURIComponent(file)}`
}

const assetName = z.string().regex(ASSET_NAME)

const BlueprintIndexEntrySchema = z.object({
  slug: z.string().regex(CANONICAL_NAME).max(CANONICAL_NAME_MAX_LENGTH),
  title: z.string(),
  summary: z.string(),
  report: assetName,
  digest: z.string().regex(/^[a-f0-9]{64}$/),
  logo: assetName.nullable(),
  cover: assetName.nullable()
})

const BlueprintIndexSchema = z.object({
  reportVersion: z.string(),
  commit: z.string(),
  blueprints: z.array(BlueprintIndexEntrySchema)
})

export type BlueprintIndex = z.infer<typeof BlueprintIndexSchema>
export type BlueprintIndexEntry = z.infer<typeof BlueprintIndexEntrySchema>

/** Read at most `limit` bytes of a body, refusing a larger one with `message`. */
export async function readLimitedBytes(response: Response, limit: number, message: string): Promise<Uint8Array> {
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

export interface ReleaseAssetRequest {
  accept: string
  limit: number
  tooLarge: string
}

/**
 * Download one asset of the Blueprint release.
 *
 * GitHub answers a release download with a redirect to its asset host, so
 * redirects are followed, but only over HTTPS. Integrity does not rest on the
 * transport: every report is checked against the digest the index records.
 * Returns null for an asset the release does not have.
 */
export async function fetchReleaseAsset(
  fetch: typeof globalThis.fetch,
  repository: string,
  file: string,
  request: ReleaseAssetRequest
): Promise<Uint8Array | null> {
  const response = await fetch(blueprintAssetUrl(repository, file), {
    headers: {
      accept: request.accept,
      // Identify the CLI so a pull is distinguishable from a browser download.
      'user-agent': `pdd-kit/${cliVersion()}`
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000)
  })
  if (response.url && !response.url.startsWith('https://')) {
    throw new Error('Refusing a Blueprint download redirected away from HTTPS.')
  }
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`The Blueprint download failed with status ${response.status}.`)
  const length = Number(response.headers.get('content-length') || 0)
  if (length > request.limit) throw new Error(request.tooLarge)
  return readLimitedBytes(response, request.limit, request.tooLarge)
}

/** The published Blueprints, or an error naming why they could not be read. */
export async function fetchBlueprintIndex(
  fetch: typeof globalThis.fetch,
  repository: string
): Promise<BlueprintIndex> {
  const bytes = await fetchReleaseAsset(fetch, repository, BLUEPRINT_INDEX_FILE, {
    accept: 'application/json',
    limit: MAX_INDEX_BYTES,
    tooLarge: 'The Blueprint index exceeds the 1 MiB safety limit.'
  })
  if (!bytes) {
    throw new Error(`${repository} publishes no Blueprints for Product Report version ${REPORT_MAJOR}.`)
  }
  let payload: unknown
  try {
    payload = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new Error('The Blueprint index is not valid JSON.')
  }
  const parsed = BlueprintIndexSchema.safeParse(payload)
  if (!parsed.success) throw new Error('The Blueprint index does not have the expected shape.')
  if (parsed.data.reportVersion !== REPORT_MAJOR) {
    throw new Error(
      `The Blueprint index lists Product Report version ${parsed.data.reportVersion}; this CLI reads version ${REPORT_MAJOR} only.`
    )
  }
  return parsed.data
}
