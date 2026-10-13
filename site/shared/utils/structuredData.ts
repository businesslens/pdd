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

const PROJECT_ID = `${SITE_ORIGIN}/#project`
const WEBSITE_ID = `${SITE_ORIGIN}/#website`
const REPOSITORY_URL = 'https://github.com/itai-gendler/pdd-kit'

type JsonLdNode = Record<string, unknown>

/** The maintainer, who publishes the site and its posts. */
const MAINTAINER: JsonLdNode = {
  '@type': 'Person',
  'name': 'Itai Gendler',
  'url': 'https://github.com/itai-gendler'
}

/**
 * The project and the site, emitted once on every public page. pdd-kit is an
 * open-source project with one maintainer, not a company, so the site is
 * published by its source code's author rather than by an Organization.
 */
export function siteGraph(): JsonLdNode[] {
  return [{
    '@type': 'SoftwareSourceCode',
    '@id': PROJECT_ID,
    'name': 'pdd-kit',
    'url': `${SITE_ORIGIN}/`,
    'codeRepository': REPOSITORY_URL,
    'license': 'https://opensource.org/licenses/MIT',
    'author': MAINTAINER,
    'sameAs': [REPOSITORY_URL, 'https://www.npmjs.com/package/pdd-toolkit']
  }, {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    'name': 'pdd-kit',
    'url': `${SITE_ORIGIN}/`,
    'about': { '@id': PROJECT_ID },
    'publisher': MAINTAINER
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
    'publisher': MAINTAINER,
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
