import type { BlueprintCard } from '../../shared/blueprints'
import { BLUEPRINT_FEED_TITLE, BLUEPRINT_FEED_URL } from '../../shared/utils/blueprintFeed'
import { SITE_ORIGIN } from '../../shared/utils/site'
import { renderRss } from './rssXml'

export interface FeedBlueprint extends Pick<BlueprintCard, 'slug' | 'title' | 'summary' | 'category'> {
  publishedAt: Date
  updatedAt: Date
}

/** One stable item per Blueprint in the repository, newest change first. */
export function buildBlueprintFeed(blueprints: FeedBlueprint[]): string {
  // Code-unit ordering keeps tied entries stable across runtime locales.
  const ordered = [...blueprints].sort((a, b) => (
    b.updatedAt.getTime() - a.updatedAt.getTime() || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0)
  ))

  return renderRss({
    title: BLUEPRINT_FEED_TITLE,
    link: `${SITE_ORIGIN}/blueprints`,
    description: 'Curated Product Models from the pdd-kit Blueprints, ordered by latest update.',
    feedUrl: BLUEPRINT_FEED_URL
  }, ordered.map(blueprint => ({
    title: blueprint.title,
    link: `${SITE_ORIGIN}/blueprints/${encodeURIComponent(blueprint.slug)}`,
    // The slug is the Blueprint's identity: its directory, its page and its pull name.
    guid: `${SITE_ORIGIN}/blueprints/${encodeURIComponent(blueprint.slug)}`,
    description: blueprint.summary,
    category: blueprint.category,
    published: blueprint.publishedAt,
    updated: blueprint.updatedAt
  })))
}
