import type { LocationQuery } from 'vue-router'
import type { BlueprintCard } from '~/utils/blueprints'
import { blueprintCategoryMeta } from './blueprintCategories'

/**
 * Pure helpers for the catalog index: what search and category leave in the
 * listing, how the result row counts it, and how the URL spells
 * the filters. See `docs/adr/0019-the-catalog-index-has-one-layout.md`.
 */

export interface CatalogFilters {
  search: string
  category: string | undefined
}

export function catalogFiltersActive(filters: CatalogFilters): boolean {
  return Boolean(filters.search.trim() || filters.category)
}

/**
 * Case-insensitive across title, summary, category — its stored value and its
 * shelf label — and tags.
 */
export function filterBlueprints<T extends Pick<BlueprintCard, 'slug' | 'title' | 'summary' | 'category' | 'tags'>>(
  blueprints: T[],
  filters: CatalogFilters
): T[] {
  const term = filters.search.trim().toLowerCase()
  return blueprints.filter((blueprint) => {
    if (filters.category && blueprint.category !== filters.category) return false
    if (!term) return true
    return [
      blueprint.title,
      blueprint.summary,
      blueprint.category,
      blueprintCategoryMeta(blueprint.category).label,
      ...blueprint.tags
    ]
      .join(' ')
      .toLowerCase()
      .includes(term)
  })
}

/**
 * The line above the grid: the size of the catalog while nothing narrows it,
 * the size of the answer once something does. Never "1 of 1".
 */
export function catalogResultSummary(total: number, shown: number, filtered: boolean): string {
  if (!filtered) return total === 1 ? '1 Blueprint' : `${total} Blueprints`
  if (shown === 0) return 'No results'
  return shown === 1 ? '1 result' : `${shown} results`
}

/**
 * Search and category as the URL spells them: `?q=` and `?category=`. Anything
 * repeated or empty reads as absent. Whether a category exists is the listing's
 * call, not the URL's — an unknown one matches nothing in the catalog and is
 * dropped there.
 */
export function catalogQueryFilters(query: LocationQuery): Pick<CatalogFilters, 'search' | 'category'> {
  const search = typeof query.q === 'string' ? query.q : ''
  const category = typeof query.category === 'string' && query.category ? query.category : undefined
  return { search, category }
}
