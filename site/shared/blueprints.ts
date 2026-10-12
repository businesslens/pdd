import type { ProductReport } from '@itai-gendler/pdd-kit/report'

/** The size glance a card and a record share. */
export interface BlueprintStats {
  entities: number
  capabilities: number
  journeys: number
  scenarios: number
  rules: number
}

/** One Blueprint as the catalog index lists it. */
export interface BlueprintCard {
  slug: string
  title: string
  summary: string
  category: string
  logo: string
  /** The optional engraved cover; null when the Blueprint has none. */
  cover: string | null
  tags: string[]
  stats: BlueprintStats
  publishedAt: string | null
}

/** One Blueprint as its page renders it: the whole portable report. */
export interface BlueprintRecord {
  slug: string
  publishedAt: string | null
  reportDigest: string
  logo: string
  cover: string | null
  report: ProductReport
  source: { path: string, commit: string }
}
