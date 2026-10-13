import {
  fetchBlueprintIndex,
  fetchReleaseAsset,
  resolveBlueprintRepository
} from '../core/blueprint-release.js'
import { parseCanonicalName } from '../core/canonical-name.js'
import { reportDigest } from '../core/report-digest.js'
import { expandProductReport } from './open.js'
import { UsageError } from '../core/usage-error.js'
import { MAX_PRODUCT_COVER_BYTES, MAX_PRODUCT_LOGO_BYTES, validateProductCover, validateProductLogo } from '../logo.js'
import { cliCommand } from '../core/invocation.js'

const MAX_REPORT_BYTES = 8 * 1024 * 1024

export interface PullOptions {
  force: boolean
}

export interface PullDependencies {
  fetch: typeof globalThis.fetch
  env: NodeJS.ProcessEnv
}

/** A logo or cover is optional: one that is missing, unreadable or invalid is skipped. */
async function fetchOptionalImage(
  fetch: typeof globalThis.fetch,
  repository: string,
  file: string | null,
  image: { accept: string, limit: number, validate: (bytes: Uint8Array) => string[] }
): Promise<Uint8Array | undefined> {
  if (!file) return undefined
  try {
    const bytes = await fetchReleaseAsset(fetch, repository, file, {
      accept: image.accept,
      limit: image.limit,
      tooLarge: 'The image exceeds its safety limit.'
    })
    return bytes && !image.validate(bytes).length ? bytes : undefined
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
  let blueprint: string
  let repository: string
  try {
    blueprint = parseCanonicalName(name)
    repository = resolveBlueprintRepository(dependencies.env ?? process.env)
  } catch (error) {
    console.error((error as Error).message)
    return error instanceof UsageError ? 2 : 1
  }

  const fetch = dependencies.fetch ?? globalThis.fetch

  let report: unknown
  let entry
  try {
    const index = await fetchBlueprintIndex(fetch, repository)
    entry = index.blueprints.find(candidate => candidate.slug === blueprint)
    if (!entry) {
      console.error(`No Blueprint is named ${blueprint}. Run \`${cliCommand('blueprint list')}\` to see them.`)
      return 1
    }
    const bytes = await fetchReleaseAsset(fetch, repository, entry.report, {
      accept: 'application/json',
      limit: MAX_REPORT_BYTES,
      tooLarge: 'The Blueprint report exceeds the 8 MiB safety limit.'
    })
    if (!bytes) throw new Error(`The ${blueprint} report is listed but not published. Try again shortly.`)
    try {
      report = JSON.parse(new TextDecoder().decode(bytes))
    } catch {
      throw new Error('The published Blueprint report is not valid JSON.')
    }
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }

  if (reportDigest(report) !== entry.digest) {
    console.error('The Blueprint report does not match the digest in the Blueprint index.')
    return 1
  }
  if ((report as { id?: unknown } | null)?.id !== blueprint) {
    console.error('The published report is for a different Blueprint.')
    return 1
  }

  const logo = await fetchOptionalImage(fetch, repository, entry.logo, {
    accept: 'image/svg+xml',
    limit: MAX_PRODUCT_LOGO_BYTES,
    validate: validateProductLogo
  })
  // A cover lives beside the logo in `product/`, so it is fetched only with one.
  const cover = logo
    ? await fetchOptionalImage(fetch, repository, entry.cover, {
      accept: 'image/webp',
      limit: MAX_PRODUCT_COVER_BYTES,
      validate: validateProductCover
    })
    : undefined

  try {
    const opened = expandProductReport(cwd, report, options.force, logo ? { logo, ...(cover ? { cover } : {}) } : {})
    console.log(`Pulled ${blueprint} into ${opened.root}.`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
}
