/** The shared RSS 2.0 envelope; callers own content selection and ordering. */
export interface RssItem {
  title: string
  link: string
  /** Plain text, encoded for HTML presentation inside the XML element. */
  description: string
  published: Date
  updated?: Date
  /** An opaque identity when a URL can be reused for a different item. */
  guid?: string
  creators?: string[]
  category?: string
  content?: string
  /** The representative image, exposed separately from article HTML. */
  image?: string
}

interface RssChannel {
  title: string
  link: string
  description: string
  feedUrl: string
}

export function renderRss(channel: RssChannel, items: RssItem[]): string {
  const latest = items.reduce<Date | undefined>((date, item) => (
    !date || item.published > date ? item.published : date
  ), undefined)

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">',
    '  <channel>',
    `    <title>${escapeText(channel.title)}</title>`,
    `    <link>${escapeText(channel.link)}</link>`,
    `    <description>${escapeText(channel.description)}</description>`,
    '    <language>en</language>',
    // lastBuildDate means a channel content change, not a render time. Neither
    // feed records every change (including removals), so omit that optional date.
    ...(latest ? [`    <pubDate>${latest.toUTCString()}</pubDate>`] : []),
    `    <atom:link href="${escapeAttribute(channel.feedUrl)}" rel="self" type="application/rss+xml" />`,
    ...items.flatMap(renderItem),
    '  </channel>',
    '</rss>',
    ''
  ].join('\n')
}

function renderItem(item: RssItem): string[] {
  return [
    '    <item>',
    `      <title>${escapeText(item.title)}</title>`,
    `      <link>${escapeText(item.link)}</link>`,
    `      <guid isPermaLink="${item.guid ? 'false' : 'true'}">${escapeText(item.guid ?? item.link)}</guid>`,
    `      <pubDate>${item.published.toUTCString()}</pubDate>`,
    ...(item.updated ? [`      <atom:updated>${item.updated.toISOString()}</atom:updated>`] : []),
    // RSS reserves <author> for an email address; names use dc:creator.
    ...(item.creators ?? []).map(name => `      <dc:creator>${escapeText(name)}</dc:creator>`),
    ...(item.category ? [`      <category>${escapeText(item.category)}</category>`] : []),
    // Readers decode XML, then render the description as HTML. Escape the
    // summary for both steps so literal tags and entities remain plain text.
    ...(item.description ? [`      <description>${escapeText(escapeText(item.description))}</description>`] : []),
    ...(item.content ? [`      <content:encoded>${cdata(item.content)}</content:encoded>`] : []),
    ...(item.image
      ? [
          `      <media:content url="${escapeAttribute(item.image)}" medium="image" />`,
          `      <media:thumbnail url="${escapeAttribute(item.image)}" />`
        ]
      : []),
    '    </item>'
  ]
}

/** XML 1.0's Char production also excludes lone surrogates and U+FFFE/U+FFFF. */
function stripInvalidXmlCharacters(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '')
}

function escapeText(value: string): string {
  return stripInvalidXmlCharacters(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;')
}

/** `]]>` inside the body would close the section early, so split it across two. */
function cdata(value: string): string {
  return `<![CDATA[${stripInvalidXmlCharacters(value).replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`
}
