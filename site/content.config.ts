import { fileURLToPath } from 'node:url'
import { defineCollection, defineContentConfig, z } from '@nuxt/content'

// The docs, the FAQ and the changelog are authored at the root of this
// repository and rendered here as-is; `pnpm dev` hot-reloads edits to them.
//
// Absolute paths, because Nuxt Content's HMR watcher reports absolute changed
// paths and cannot match them against a relative collection cwd.
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const docsDir = fileURLToPath(new URL('../docs', import.meta.url))

// Docs frontmatter contract: `group` names the sidebar cluster and `order`
// sorts within it.
const docsSchema = z.object({
  order: z.number().optional(),
  group: z.string().optional()
})

const blogSchema = z.object({
  date: z.string(),
  image: z.string(),
  // The post's kind (Launch, Engineering, Perspective). The site no longer shows
  // it; it is the RSS item's `<category>`, which feed readers group by.
  badge: z.string().optional(),
  authors: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    to: z.string().optional(),
    avatar: z.object({
      src: z.string(),
      alt: z.string().optional()
    }).optional()
  })).optional()
})

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      source: { cwd: docsDir, include: '**/*.md', exclude: ['faq.md'], prefix: '/docs' },
      schema: docsSchema
    }),
    faq: defineCollection({
      type: 'page',
      source: { cwd: docsDir, include: 'faq.md', prefix: '/' }
    }),
    // Excluding every subdirectory keeps the dev watcher off the rest of the
    // checkout.
    changelog: defineCollection({
      type: 'page',
      source: { cwd: repoRoot, include: 'CHANGELOG.md', exclude: ['*/**'], prefix: '/changelog' }
    }),
    blog: defineCollection({
      type: 'page',
      source: {
        include: 'blog/**',
        prefix: '/blog'
      },
      schema: blogSchema
    })
  }
})
