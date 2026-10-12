type MinimarkNode = string | [string, Record<string, unknown>, ...MinimarkNode[]]

export interface ChangelogRelease {
  /** The `##` heading's id. */
  id: string
  /**
   * `v0-24-0`, or `unreleased`: the card's anchor. No dots, because Nuxt finds
   * the anchor's scroll margin with `querySelector`, which reads them as classes.
   */
  slug: string
  /** `v0.24.0`, or `Unreleased`. */
  title: string
  date?: string
  /** Where the heading's label links: its GitHub comparison. */
  to?: string
  nodes: MinimarkNode[]
}

function textOf(node: MinimarkNode): string {
  return typeof node === 'string' ? node : node.slice(2).map(child => textOf(child as MinimarkNode)).join('')
}

function hrefOf(node: MinimarkNode): string | undefined {
  if (typeof node === 'string') return undefined
  const [tag, props, ...children] = node
  if (tag === 'a' && typeof props.href === 'string') return props.href
  for (const child of children) {
    const href = hrefOf(child)
    if (href) return href
  }
  return undefined
}

/**
 * Split a parsed Keep a Changelog document into its `##` releases, in file
 * order. A heading `[0.23.0] - 2026-10-04` gives the version, the date, and the
 * link its label resolves to; everything up to the next `##` is that release's
 * entries, untouched.
 *
 * Only a dated version is a release. `[Unreleased]` is what `main` has merged
 * but not shipped, so it never becomes a card, whatever it holds; neither does
 * a release with no entries.
 */
export function changelogReleases(body: MinimarkNode[]): ChangelogRelease[] {
  const releases: ChangelogRelease[] = []
  for (const node of body) {
    if (typeof node !== 'string' && node[0] === 'h2') {
      const [label = '', date] = textOf(node).split(' - ').map(part => part.trim())
      const version = /^\d+\.\d+\.\d+/.test(label) ? `v${label}` : label
      releases.push({
        id: String(node[1].id ?? ''),
        slug: version.toLowerCase().replace(/[\s.]+/g, '-'),
        title: version,
        date,
        to: hrefOf(node),
        nodes: []
      })
    } else {
      releases.at(-1)?.nodes.push(node)
    }
  }
  return releases.filter(release => /^\d{4}-\d{2}-\d{2}$/.test(release.date ?? '')
    && release.nodes.some(node => typeof node !== 'string' || node.trim()))
}

/**
 * The icon a release's `###` section wears. The file keeps Keep a Changelog's
 * plain words; the page adds the mark, as Nuxt UI's releases do with emoji.
 */
const SECTION_ICONS: Record<string, string> = {
  added: 'i-lucide-sparkles',
  changed: 'i-lucide-refresh-ccw',
  deprecated: 'i-lucide-archive',
  removed: 'i-lucide-trash-2',
  fixed: 'i-lucide-bug',
  security: 'i-lucide-shield-check',
  contributors: 'i-lucide-heart'
}

export function changelogSectionIcon(title: string) {
  return SECTION_ICONS[title.trim().toLowerCase()]
}
