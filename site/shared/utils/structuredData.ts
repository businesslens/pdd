// Imported by path rather than auto-imported, so the integration tests can load
// this module under Vitest, which does not apply Nuxt's transform.
import { SITE_ORIGIN } from './site'

/**
 * Schema.org builders for the JSON-LD the public pages emit.
 *
 * Every node states what the visible page already says: a breadcrumb names the
 * sections a reader can click through, an article repeats its own heading,
 * date and author. Search engines penalise markup that disagrees with the page,
 * so nothing here invents a value the page does not show.
 */

const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`
const WEBSITE_ID = `${SITE_ORIGIN}/#website`

type JsonLdNode = Record<string, unknown>

/** The publisher and the site, emitted once on every public page. */
export function siteGraph(): JsonLdNode[] {
  return [{
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    'name': 'pdd-kit',
    'url': `${SITE_ORIGIN}/`,
    'logo': `${SITE_ORIGIN}/brand/icons/icon-512.png`,
    'sameAs': ['https://github.com/pdd-kit']
  }, {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    'name': 'pdd-kit',
    'url': `${SITE_ORIGIN}/`,
    'publisher': { '@id': ORGANIZATION_ID }
  }]
}

interface Crumb {
  name: string
  path: string
}

export function breadcrumbList(crumbs: Crumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    'itemListElement': crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.name,
      'item': absoluteSiteURL(crumb.path)
    }))
  }
}

interface BlogPostingInput {
  path: string
  headline: string
  description: string
  image: string
  datePublished: string
  authors: { name: string, to?: string }[]
}

export function blogPosting(post: BlogPostingInput): JsonLdNode {
  const url = absoluteSiteURL(post.path)
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    'url': url,
    'mainEntityOfPage': url,
    'headline': post.headline,
    'description': post.description,
    'image': absoluteSiteURL(post.image),
    'datePublished': post.datePublished,
    'author': post.authors.map(author => ({
      '@type': 'Person',
      'name': author.name,
      ...(author.to ? { url: author.to } : {})
    })),
    'publisher': { '@id': ORGANIZATION_ID },
    'isPartOf': { '@id': WEBSITE_ID }
  }
}

/**
 * Serialise a graph for a `<script type="application/ld+json">` body.
 *
 * `<` is escaped so a value containing `</script>` cannot close the element
 * early; JSON parsers read `<` back as the same character.
 */
export function serializeJsonLd(graph: JsonLdNode[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    .replace(/</g, '\\u003c')
}

/** Resolve a site path, or pass an absolute URL through unchanged. */
export function absoluteSiteURL(pathOrURL: string): string {
  return new URL(pathOrURL, SITE_ORIGIN).href
}
