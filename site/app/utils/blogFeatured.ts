/**
 * Which post leads `/blog`, and in what order the rest follow.
 *
 * **The lead is pinned, not the newest.** Date order would put whatever shipped
 * last at the top, and the post a first-time visitor should read is not a
 * function of when it was written — it is the one that says what this is.
 * `introducing-pdd-kit` holds that slot until there is a reason to move it,
 * and moving it is a one-line edit here rather than a date change that also
 * lies about when something was published.
 *
 * Every arrangement takes `featured` and `rest` as props from this, so none of
 * them can promote a different post and drift from the others.
 */
export const FEATURED_POST_SLUG = 'introducing-pdd-kit'

export interface BlogPostSummary {
  path: string
  title: string
  description: string
  image: string
  date: string
  authors?: Array<{
    name: string
    to?: string
    avatar?: { src: string, alt?: string }
  }>
}

/**
 * Splits a date-ordered list into the lead and the remainder.
 *
 * Falls back to the first post when the pinned slug is missing, so renaming or
 * unpublishing the lead degrades to "newest leads" rather than to an empty
 * hero — a blog index with no lead is a broken page, and a blog index whose
 * lead is merely the wrong one still reads.
 */
export function splitFeatured(posts: BlogPostSummary[]) {
  const index = posts.findIndex(post => post.path === `/blog/${FEATURED_POST_SLUG}`)
  const at = index === -1 ? 0 : index
  return {
    featured: posts[at],
    rest: posts.filter((_, position) => position !== at)
  }
}
