/**
 * Copy and derived values shared by every blog post, in one place.
 *
 * The article layout in `components/landing/blog/` renders this, so the closing
 * call to action stays aligned with the rest of the site when the messaging
 * changes rather than being restated per post.
 */
export const articleCta = {
  title: 'Give your agent the product, not just the code.',
  description:
    'Build a Product Model in your own repository, or pull a Blueprint and hand it straight to a coding agent.',
  primary: { label: 'Read the docs', to: '/docs' },
  secondary: { label: 'Browse Blueprints', to: '/blueprints' }
}

export function formatPostDate(date?: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  })
}

/** Silent-reading pace for prose. Comprehension studies cluster around here. */
const WORDS_PER_MINUTE = 238

/**
 * A minimark node is `[tag, props, ...children]`, and text is a plain string, so
 * everything from index 2 on is what a reader actually sees. Walking the tree
 * rather than the raw Markdown keeps frontmatter, link hrefs, and image
 * attributes out of the count.
 */
function collectText(node: unknown, words: string[]) {
  if (typeof node === 'string') {
    words.push(node)
    return
  }
  if (!Array.isArray(node)) return
  for (const child of node.slice(2)) collectText(child, words)
}

/** Reading time in whole minutes, never zero — "0 minutes" reads as an error. */
export function readingMinutes(body: unknown): number {
  const nodes = (body as { value?: unknown } | undefined)?.value
  if (!Array.isArray(nodes)) return 1

  const words: string[] = []
  for (const node of nodes) collectText(node, words)

  const count = words.join(' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(count / WORDS_PER_MINUTE))
}
