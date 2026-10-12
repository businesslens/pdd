import { describe, expect, it } from 'vitest'
import { blueprintCategoryEntries, blueprintCategoryMeta } from '../../app/utils/blueprintCategories'

describe('Blueprint category presentation', () => {
  it('names and tints each catalog shelf', () => {
    expect(blueprintCategoryMeta('community')).toMatchObject({
      value: 'community',
      label: 'Community',
      tone: {
        ink: 'text-amber-600 dark:text-amber-400',
        soft: 'bg-amber-500/15'
      }
    })
    expect(blueprintCategoryMeta('dev-tools').label).toBe('Dev Tools')
  })

  it('keeps no aliases: a retired category name is just an unknown category', () => {
    expect(blueprintCategoryMeta('personal-productivity')).toMatchObject({ value: 'personal-productivity', label: 'Personal productivity', tone: { ink: 'text-toned' } })
  })

  it('falls back to a neutral, readable label for an unknown category', () => {
    expect(blueprintCategoryMeta('home-and-garden')).toMatchObject({ label: 'Home and garden', tone: { ink: 'text-toned' } })
  })

  it('orders shelves as the catalog lists them, unknown categories last', () => {
    const entries = blueprintCategoryEntries([
      { category: 'education' },
      { category: 'home-and-garden' },
      { category: 'productivity' },
      { category: 'dev-tools' }
    ])

    expect(entries.map(entry => entry.value)).toEqual([
      'productivity',
      'dev-tools',
      'education',
      'home-and-garden'
    ])
  })
})
