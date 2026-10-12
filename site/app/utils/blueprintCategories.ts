/**
 * Display metadata for a Blueprint category: what the sidebar, the chips, and
 * the card icon chips render for it.
 *
 * The five named entries are the catalog's curated shelves. A category the map
 * does not know — every real Product category is allowed here — falls back to
 * the report formatter and a neutral tint, so an unknown value degrades to a
 * plain labelled entry rather than an error.
 */
export interface BlueprintCategoryMeta {
  value: string
  label: string
  icon: string
  /** Tailwind classes for tinted surfaces keyed off the category. */
  tone: {
    /** A tinted icon chip: section headers and similar. */
    chip: string
    /** Icon color alone, for the card's white badge. */
    ink: string
    /** The low-emphasis tint behind a card's logo when it has no cover. */
    soft: string
  }
}

/** `home-and-garden` → `Home and garden`, for a category the map has not curated. */
function formatCategory(value: string): string {
  const words = value.replaceAll('-', ' ').trim()
  return words ? `${words.charAt(0).toUpperCase()}${words.slice(1)}` : value
}

const NEUTRAL_TONE: BlueprintCategoryMeta['tone'] = {
  chip: 'bg-elevated text-toned',
  ink: 'text-toned',
  soft: 'bg-accented/40'
}

const CATEGORY_META: Record<string, Omit<BlueprintCategoryMeta, 'value'>> = {
  'productivity': {
    label: 'Productivity',
    icon: 'i-lucide-user',
    tone: {
      chip: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
      ink: 'text-teal-600 dark:text-teal-400',
      soft: 'bg-teal-500/15'
    }
  },
  'collaboration': {
    label: 'Collaboration',
    icon: 'i-lucide-users',
    tone: {
      chip: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      ink: 'text-indigo-600 dark:text-indigo-400',
      soft: 'bg-indigo-500/15'
    }
  },
  'dev-tools': {
    label: 'Dev Tools',
    icon: 'i-lucide-code-xml',
    tone: {
      chip: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      ink: 'text-blue-600 dark:text-blue-400',
      soft: 'bg-blue-500/15'
    }
  },
  'community': {
    label: 'Community',
    icon: 'i-lucide-messages-square',
    tone: {
      chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      ink: 'text-amber-600 dark:text-amber-400',
      soft: 'bg-amber-500/15'
    }
  },
  'education': {
    label: 'Education',
    icon: 'i-lucide-book-open',
    tone: {
      chip: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
      ink: 'text-violet-600 dark:text-violet-400',
      soft: 'bg-violet-500/15'
    }
  }
}

export function blueprintCategoryMeta(value: string): BlueprintCategoryMeta {
  const known = CATEGORY_META[value]
  if (known) return { value, ...known }
  return {
    value,
    label: formatCategory(value),
    icon: 'i-lucide-shapes',
    tone: NEUTRAL_TONE
  }
}

/** A category entry as the navigation surfaces render it: meta plus its size. */
export interface BlueprintCategoryEntry extends BlueprintCategoryMeta {
  count: number
}

/**
 * The categories present in a card list, with counts. Curated shelves keep
 * the shelf order of the map above; anything unknown follows alphabetically.
 */
export function blueprintCategoryEntries(
  cards: Array<{ category: string }>
): BlueprintCategoryEntry[] {
  const shelfOrder = Object.keys(CATEGORY_META)
  const counts = new Map<string, number>()
  for (const card of cards) {
    counts.set(card.category, (counts.get(card.category) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ ...blueprintCategoryMeta(value), count }))
    .sort((a, b) => {
      const aIndex = shelfOrder.indexOf(a.value)
      const bIndex = shelfOrder.indexOf(b.value)
      if (aIndex === -1 && bIndex === -1) return a.label.localeCompare(b.label)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
}
