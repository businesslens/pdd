import { queryCollection } from '@nuxt/content/nitro'

const STATIC_PATHS = [
  '/',
  '/blueprints',
  '/blog',
  '/changelog',
  '/contact',
  '/faq',
  '/privacy'
]

export default defineEventHandler(async (event) => {
  const [docs, blogPosts, blueprints] = await Promise.all([
    queryCollection(event, 'docs').select('path').all(),
    queryCollection(event, 'blog').select('path').all(),
    listBlueprintCards()
  ])

  const paths = [
    ...STATIC_PATHS,
    ...docs.map(doc => doc.path),
    ...blogPosts.map(post => post.path),
    ...blueprints.map(blueprint => `/blueprints/${blueprint.slug}`)
  ]

  const urls = paths
    .map(path => `  <url>\n    <loc>${new URL(path, SITE_ORIGIN).href}</loc>\n  </url>`)
    .join('\n')

  setHeader(event, 'content-type', 'application/xml')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
})
