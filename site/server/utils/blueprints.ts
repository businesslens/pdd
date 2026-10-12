import type { ProductReport } from '@itai-gendler/pdd-kit/report'
import type { BlueprintCard, BlueprintRecord } from '../../shared/blueprints'

interface IndexEntry {
  slug: string
  report: string
  digest: string
  logo: string | null
  cover: string | null
}

interface BlueprintIndex {
  commit: string
  blueprints: IndexEntry[]
}

type Dates = Record<string, { publishedAt: string | null, updatedAt: string | null }>

/** Logos, covers and reports are served from `.data/blueprints` at this path. */
const ASSET_BASE = '/_blueprints'

/*
 * `.data/blueprints` is the server asset store `blueprints` (see nuxt.config).
 * It is read while the site is generated, so every page and feed is built from
 * the same files `pnpm blueprints` prepared.
 */
const storage = () => useStorage('assets:blueprints')

async function readJson<T>(file: string): Promise<T> {
  const value = await storage().getItem<T>(file)
  if (value === null) throw new Error(`.data/blueprints/${file} is missing. Run \`pnpm blueprints\` first.`)
  return value
}

const assetUrl = (file: string | null) => file ? `${ASSET_BASE}/${file}` : null

function card(entry: IndexEntry, report: ProductReport, dates: Dates): BlueprintCard {
  return {
    slug: entry.slug,
    title: report.title,
    summary: report.summary,
    category: report.category ?? 'other',
    logo: assetUrl(entry.logo) ?? '',
    cover: assetUrl(entry.cover),
    tags: report.tags,
    stats: {
      // An Actor is an Entity that acts, so Entities are not counted apart.
      entities: report.counts.entities,
      capabilities: report.counts.capabilities,
      journeys: report.counts.journeys,
      // A card is a size glance, so it carries both Scenario collections' total.
      scenarios: report.counts.capabilityScenarios + report.counts.journeyScenarios,
      rules: report.counts.businessRules
    },
    publishedAt: dates[entry.slug]?.publishedAt ?? null
  }
}

/** Every Blueprint with its report, in index order. */
async function readAll() {
  const [index, dates] = await Promise.all([readJson<BlueprintIndex>('index.json'), readJson<Dates>('dates.json')])
  const reports = await Promise.all(index.blueprints.map(entry => readJson<ProductReport>(entry.report)))
  return { index, dates, entries: index.blueprints.map((entry, i) => ({ entry, report: reports[i]! })) }
}

export async function listBlueprintCards(): Promise<BlueprintCard[]> {
  const { dates, entries } = await readAll()
  return entries.map(({ entry, report }) => card(entry, report, dates))
}

export async function getBlueprintRecord(slug: string): Promise<BlueprintRecord | null> {
  const { index, dates, entries } = await readAll()
  const found = entries.find(({ entry }) => entry.slug === slug)
  if (!found) return null
  const { entry, report } = found
  return {
    slug,
    publishedAt: dates[slug]?.publishedAt ?? null,
    reportDigest: entry.digest,
    logo: assetUrl(entry.logo) ?? '',
    cover: assetUrl(entry.cover),
    report,
    source: { path: `blueprints/${slug}`, commit: index.commit }
  }
}

/** What the Blueprint feed needs: each card with its last change. */
export async function listBlueprintFeed() {
  const { dates, entries } = await readAll()
  return entries.map(({ entry, report }) => {
    const { slug, title, summary, category } = card(entry, report, dates)
    const published = dates[slug]?.publishedAt
    const updated = dates[slug]?.updatedAt ?? published
    return {
      slug,
      title,
      summary,
      category,
      publishedAt: new Date(published ?? 0),
      updatedAt: new Date(updated ?? 0)
    }
  })
}
