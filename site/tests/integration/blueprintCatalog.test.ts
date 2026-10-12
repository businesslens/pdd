import { describe, expect, it } from 'vitest'
import {
  catalogFiltersActive,
  catalogQueryFilters,
  catalogResultSummary,
  filterBlueprints
} from '../../app/utils/blueprintCatalog'

const none = { search: '', category: undefined }

const cards = [
  { slug: 'task-board', title: 'Task Board', summary: 'Assign and close work.', category: 'productivity', tags: ['kanban'] },
  { slug: 'feed-reader', title: 'Feed Reader', summary: 'Follow syndicated feeds.', category: 'community', tags: ['rss'] },
  { slug: 'status-page', title: 'Status Page', summary: 'Publish incidents.', category: 'dev-tools', tags: ['uptime'] }
]

describe('catalog filtering', () => {
  const titles = (filters: Parameters<typeof filterBlueprints>[1]) =>
    filterBlueprints(cards, filters).map(card => card.title)

  it('matches case-insensitively across title, summary, category, its label, and tags', () => {
    expect(titles({ ...none, search: 'TASK' })).toEqual(['Task Board'])
    expect(titles({ ...none, search: 'syndicated' })).toEqual(['Feed Reader'])
    expect(titles({ ...none, search: 'dev-tools' })).toEqual(['Status Page'])
    // A category matches by its label as well as its stored value.
    expect(titles({ ...none, search: 'Community' })).toEqual(['Feed Reader'])
    expect(titles({ ...none, search: 'Uptime' })).toEqual(['Status Page'])
  })

  it('ignores surrounding whitespace and treats a blank search as none', () => {
    expect(titles({ ...none, search: '  rss  ' })).toEqual(['Feed Reader'])
    expect(titles({ ...none, search: '   ' })).toHaveLength(3)
  })

  it('narrows by category together with search', () => {
    expect(titles({ ...none, category: 'community' })).toEqual(['Feed Reader'])
    expect(titles({ search: 'feed', category: 'dev-tools' })).toEqual([])
  })

  it('knows when anything is narrowing the listing', () => {
    expect(catalogFiltersActive(none)).toBe(false)
    expect(catalogFiltersActive({ ...none, search: '  ' })).toBe(false)
    expect(catalogFiltersActive({ ...none, search: 'x' })).toBe(true)
    expect(catalogFiltersActive({ ...none, category: 'community' })).toBe(true)
  })
})

describe('catalog result summary', () => {
  it('counts the catalog until something narrows it, then counts the answer', () => {
    expect(catalogResultSummary(6, 6, false)).toBe('6 Blueprints')
    expect(catalogResultSummary(1, 1, false)).toBe('1 Blueprint')
    expect(catalogResultSummary(6, 3, true)).toBe('3 results')
    expect(catalogResultSummary(6, 1, true)).toBe('1 result')
    expect(catalogResultSummary(6, 0, true)).toBe('No results')
  })
})

describe('catalog URL filters', () => {
  it('reads search and category from q and category', () => {
    expect(catalogQueryFilters({ q: 'tasks', category: 'community' })).toEqual({ search: 'tasks', category: 'community' })
  })

  it('reads a missing, empty, or repeated value as absent', () => {
    expect(catalogQueryFilters({})).toEqual({ search: '', category: undefined })
    expect(catalogQueryFilters({ category: '' })).toEqual({ search: '', category: undefined })
    expect(catalogQueryFilters({ q: ['a', 'b'], category: ['x', 'y'] })).toEqual({ search: '', category: undefined })
  })
})
