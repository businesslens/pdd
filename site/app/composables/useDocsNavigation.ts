import type { ContentNavigationItem } from '@nuxt/content'

interface DocsNavigationDoc {
  path: string
  title: string
  description: string
  group?: string
}

// Cluster the docs into sidebar groups from `group` frontmatter, preserving
// `order`. Docs without a group stay top-level, so pdd revisions that predate
// the contract still render.
function groupNavigation(docs: DocsNavigationDoc[]): ContentNavigationItem[] {
  const items: ContentNavigationItem[] = []
  const groups = new Map<string, ContentNavigationItem>()

  for (const doc of docs) {
    const leaf: ContentNavigationItem = { title: doc.title, path: doc.path, exact: true }
    if (!doc.group) {
      items.push(leaf)
      continue
    }
    let group = groups.get(doc.group)
    if (!group) {
      group = { title: doc.group, path: doc.path, defaultOpen: true, children: [] }
      groups.set(doc.group, group)
      items.push(group)
    }
    group.children!.push(leaf)
  }

  return items
}

export async function useDocsNavigation() {
  const { data: docs } = await useAsyncData('docs-sections', () =>
    queryCollection('docs').order('order', 'ASC').select('path', 'title', 'description', 'group').all())

  const navigation = computed<ContentNavigationItem[]>(() => groupNavigation(docs.value ?? []))

  return { navigation, docs }
}
