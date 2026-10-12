import {
  BLOG_DESCRIPTION,
  BLOG_FEED_TITLE,
  BLOG_FEED_URL,
  BLOG_URL
} from '../../shared/utils/blog'
import { SITE_ORIGIN } from '../../shared/utils/site'
import { absoluteUrl, renderPostHtml } from './rssContent'
import { escapeAttribute, renderRss, type RssItem } from './rssXml'

/**
 * RSS 2.0 for the blog, built by hand.
 *
 * The envelope is small enough that a generator would cost more than it saves:
 * `feed` pulls in `xml-js`, unpublished since 2019, and `server/routes/
 * sitemap.xml.get.ts` already sets the precedent for writing this XML directly.
 * What the generator would have given for free is written out instead — RFC 822
 * dates via `toUTCString`, `atom:link rel="self"`, `dc:creator` for authors with
 * no email address, and CDATA that survives a `]]>` in the body.
 *
 * Everything here is pure: unchanged posts produce byte-identical XML across
 * requests and builds. The route is the only part that touches an event.
 */

export interface FeedPostAuthor {
  name?: string
}

/** The subset of a blog collection entry the feed reads. */
export interface FeedPost {
  path?: string
  title?: string
  description?: string
  date?: string
  image?: string
  badge?: string
  authors?: FeedPostAuthor[]
  body?: unknown
}

export interface SkippedPost {
  path: string
  reason: string
}

export interface BlogFeedResult {
  xml: string
  skipped: SkippedPost[]
}

export interface BlogFeedOptions {
  posts: FeedPost[]
}

export function buildBlogFeed(options: BlogFeedOptions): BlogFeedResult {
  const skipped: SkippedPost[] = []
  const items: RssItem[] = []

  for (const post of options.posts) {
    const item = toFeedItem(post, skipped)
    if (item) items.push(item)
  }

  // Newest first, then by URL. Two posts sharing a date is the ordinary case for
  // a launch day, and an arbitrary order there would make the feed churn between
  // builds for no reason a reader could see. Use code-unit order so the runtime
  // locale cannot change the XML or its ETag.
  items.sort((a, b) => (
    b.published.getTime() - a.published.getTime() || (a.link < b.link ? -1 : a.link > b.link ? 1 : 0)
  ))

  return {
    xml: renderRss({
      title: BLOG_FEED_TITLE,
      link: BLOG_URL,
      description: BLOG_DESCRIPTION,
      feedUrl: BLOG_FEED_URL
    }, items),
    skipped
  }
}

function toFeedItem(post: FeedPost, skipped: SkippedPost[]): RssItem | undefined {
  const path = typeof post.path === 'string' ? post.path.trim() : ''
  const identifier = path || post.title || '<unidentified post>'

  if (!path.startsWith('/')) {
    skipped.push({ path: identifier, reason: 'missing an absolute path' })
    return undefined
  }

  const title = typeof post.title === 'string' ? post.title.trim() : ''
  if (!title) {
    skipped.push({ path: identifier, reason: 'missing a title' })
    return undefined
  }

  const published = parseDate(post.date)
  if (!published) {
    skipped.push({ path: identifier, reason: `unparseable date ${JSON.stringify(post.date)}` })
    return undefined
  }

  const link = new URL(path, SITE_ORIGIN).href
  const imageUrl = absoluteUrl(post.image, link)
  // Article links may be mailto URLs; cover images must be fetchable over HTTP.
  const image = imageUrl && /^https?:\/\//.test(imageUrl) ? imageUrl : undefined

  return {
    title,
    link,
    description: typeof post.description === 'string' ? post.description.trim() : '',
    published,
    creators: (post.authors ?? [])
      .map(author => (typeof author?.name === 'string' ? author.name.trim() : ''))
      .filter(name => name !== ''),
    category: typeof post.badge === 'string' && post.badge.trim() !== ''
      ? post.badge.trim()
      : undefined,
    image,
    content: itemContent(post, link, image)
  }
}

/**
 * The hero leads the entry. It is the one image a reader will not otherwise see:
 * it lives in frontmatter and the post layout renders it above the prose, so the
 * body markup has never contained it.
 */
function itemContent(post: FeedPost, link: string, image: string | undefined): string {
  const html = renderPostHtml(post.body, link)
  if (!image) return html

  const alt = typeof post.title === 'string' ? post.title : ''
  return `<p><img src="${escapeAttribute(image)}" alt="${escapeAttribute(alt)}" /></p>${html}`
}

/**
 * `2026-08-13` parses as UTC midnight, which is what the site already shows and
 * what keeps the feed stable regardless of where it is built.
 */
function parseDate(value: unknown): Date | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value
  if (typeof value !== 'string' || value.trim() === '') return undefined

  const parsed = new Date(value.trim())
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}
