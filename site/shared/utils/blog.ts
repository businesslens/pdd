// Imported by path rather than auto-imported, so this module also resolves for
// `server/utils/rss.ts` under Vitest, which does not apply Nuxt's transform.
import { SITE_ORIGIN } from './site'

/**
 * The blog's public identity, named once because the pages and the feed both
 * state it and a reader sees whichever reaches them first.
 */

/** The blog index: the feed's channel link, and the base every entry resolves against. */
export const BLOG_URL = `${SITE_ORIGIN}/blog`

/**
 * Served by `server/routes/blog/rss.xml.get.ts`. Stable — readers store it.
 *
 * The blog index links to this rather than to `BLOG_FEED_URL`, so a preview or
 * development host sends a reader to its own feed instead of to production.
 */
export const BLOG_FEED_PATH = '/blog/rss.xml'

export const BLOG_FEED_URL = `${SITE_ORIGIN}${BLOG_FEED_PATH}`

/**
 * Shared by the feed's channel title and the `<link rel="alternate">` on every
 * blog page, which must agree.
 */
export const BLOG_FEED_TITLE = 'pdd-kit Blog'

/** Shared by the blog index's meta description and the feed's channel description. */
export const BLOG_DESCRIPTION = 'Ideas and field notes on Product-Driven Development, machine-readable product knowledge, coding agents, and the emerging pdd-kit standard.'
