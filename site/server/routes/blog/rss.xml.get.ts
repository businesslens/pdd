import { queryCollection } from '@nuxt/content/nitro'
import { buildBlogFeed } from '../../utils/rss'

/**
 * The blog feed, at the URL readers will store: `/blog/rss.xml`.
 *
 * A native Nitro handler rather than an oRPC procedure. Nothing here is an
 * application API — there is no contract to share with a client, no schema worth
 * publishing in the OpenAPI document, and the response is XML. It reads Nuxt
 * Content and nothing else, so it answers with no database, no session, and no
 * Resend credentials, which is what lets the container smoke test assert it.
 */
export default defineEventHandler(async (event) => {
  const posts = await queryCollection(event, 'blog').all()

  const { xml, skipped } = buildBlogFeed({ posts })

  // A post silently missing from the feed is the failure worth naming. This runs
  // at prerender time in a deployed build, so the warning lands in the CI log.
  for (const post of skipped) {
    console.warn(`[blog/rss.xml] skipped ${post.path}: ${post.reason}`)
  }

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return xml
})
