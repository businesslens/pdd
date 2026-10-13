import type { MaybeRefOrGetter } from 'vue'

/**
 * The site's search and link-preview metadata, stated once per page.
 *
 * A page names its title, description and, when it has one, its own image. This
 * writes those values to the document head, Open Graph and the Twitter card
 * together, so a shared link never previews a different title or picture from
 * the one a search result shows. The canonical URL and the site-wide defaults
 * come from `useSiteSeoDefaults` in `app.vue`; a page cannot drift from them
 * because it never restates them.
 */

const DEFAULT_IMAGE = {
  src: '/product-model-open-graph.png',
  alt: 'pdd-kit — "AI agents need a Product Model", beside an illustrated map with the product at its centre and the parts of its model ringed around it.'
}

const DEFAULT_TITLE = 'pdd-kit'
const DEFAULT_DESCRIPTION = 'pdd-kit gives your software product a living, machine-readable Product Model that you and your coding agent build from and check against.'

interface SiteSeoImage {
  /** A site path or an absolute URL. Social crawlers receive it absolute. */
  src: string
  alt: string
}

interface SiteSeoArticle {
  /** ISO 8601 date or date-time. */
  publishedTime: string
  /** Profile URLs of the authors. */
  authors: string[]
}

interface SiteSeoInput {
  /** The full document title, including its `· pdd-kit` suffix. */
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string | undefined>
  /** A shorter title for link previews, where the site name is already shown. */
  socialTitle?: MaybeRefOrGetter<string | undefined>
  image?: MaybeRefOrGetter<SiteSeoImage | undefined>
  /** Marks the page as an article rather than a website. */
  article?: MaybeRefOrGetter<SiteSeoArticle | undefined>
  /** JSON-LD nodes describing this page, beside the site-wide graph. */
  structuredData?: MaybeRefOrGetter<Record<string, unknown>[]>
}

export function useSiteSeo(input: SiteSeoInput) {
  const socialTitle = () => toValue(input.socialTitle) ?? toValue(input.title)
  const image = () => {
    const value = toValue(input.image)
    return value ? { url: absoluteSiteURL(value.src), alt: value.alt } : undefined
  }
  const article = () => toValue(input.article)

  useSeoMeta({
    title: () => toValue(input.title),
    description: () => toValue(input.description),
    ogTitle: socialTitle,
    ogDescription: () => toValue(input.description),
    twitterTitle: socialTitle,
    twitterDescription: () => toValue(input.description),
    ogImage: () => image()?.url,
    ogImageAlt: () => image()?.alt,
    twitterImage: () => image()?.url,
    twitterImageAlt: () => image()?.alt,
    ogType: () => article() ? 'article' : undefined,
    articlePublishedTime: () => article()?.publishedTime,
    // Unhead renders an empty list as a bare `content` attribute, so a post
    // without author links states no author rather than a blank one.
    articleAuthor: () => article()?.authors.length ? article()!.authors : undefined
  })

  if (input.structuredData) {
    const structuredData = input.structuredData
    // A page with nothing to describe, such as the docs index, emits no block
    // rather than an empty graph.
    useHead({
      script: () => {
        const nodes = toValue(structuredData)
        return nodes.length
          ? [{ key: 'structured-data-page', type: 'application/ld+json', innerHTML: serializeJsonLd(nodes) }]
          : []
      }
    })
  }
}

/**
 * The default title and description, the canonical URL, the default preview
 * and the site-wide JSON-LD. Called by `app.vue`, so every page has them before
 * it says anything of its own.
 */
export function useSiteSeoDefaults() {
  // Read from the route, not the request: `app.vue` stays mounted across
  // client-side navigation, so a value captured once would keep naming the
  // first page. The server redirects `/faq/` to `/faq`; strip it here too so a
  // render that somehow bypasses the redirect still names the one spelling.
  const route = useRoute()
  const canonicalURL = () => absoluteSiteURL(route.path.replace(/(.)\/+$/, '$1'))
  const image = absoluteSiteURL(DEFAULT_IMAGE.src)

  useHead({
    link: () => [{ rel: 'canonical', href: canonicalURL() }],
    script: [{
      key: 'structured-data-site',
      type: 'application/ld+json',
      innerHTML: serializeJsonLd(siteGraph())
    }]
  })

  useSeoMeta({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    ogSiteName: 'pdd-kit',
    ogTitle: DEFAULT_TITLE,
    ogDescription: DEFAULT_DESCRIPTION,
    ogType: 'website',
    ogUrl: canonicalURL,
    ogImage: image,
    ogImageAlt: DEFAULT_IMAGE.alt,
    twitterCard: 'summary_large_image',
    twitterImage: image,
    twitterImageAlt: DEFAULT_IMAGE.alt
  })
}
