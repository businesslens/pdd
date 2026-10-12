import { describe, expect, it } from 'vitest'
import { changelogReleases, changelogSectionIcon } from '../../app/utils/changelogReleases'

type Node = Parameters<typeof changelogReleases>[0][number]

const entries: Node = ['ul', {}, ['li', {}, 'Read the ', ['a', { href: 'https://example.com' }, 'docs']]]

function document(unreleased: Node[] = []): Node[] {
  return [
    ['h1', { id: 'changelog' }, 'Changelog'],
    ['p', {}, 'All notable changes.'],
    ['h2', { id: 'unreleased' }, ['a', { href: 'https://example.com/compare/v0.2.0...HEAD' }, 'Unreleased']],
    ...unreleased,
    ['h2', { id: '_020-2026-10-04' }, ['a', { href: 'https://example.com/compare/v0.1.0...v0.2.0' }, '0.2.0'], ' - 2026-10-04'],
    ['h3', { id: 'added' }, 'Added'],
    entries,
    ['h2', { id: '_010-2026-09-01' }, ['a', { href: 'https://example.com/v0.1.0' }, '0.1.0'], ' - 2026-09-01'],
    ['p', {}, 'First release.']
  ]
}

describe('changelogReleases', () => {
  it('splits releases at each h2, in file order, keeping their entries untouched', () => {
    expect(changelogReleases(document())).toEqual([{
      id: '_020-2026-10-04',
      slug: 'v0-2-0',
      title: 'v0.2.0',
      date: '2026-10-04',
      to: 'https://example.com/compare/v0.1.0...v0.2.0',
      nodes: [['h3', { id: 'added' }, 'Added'], entries]
    }, {
      id: '_010-2026-09-01',
      slug: 'v0-1-0',
      title: 'v0.1.0',
      date: '2026-09-01',
      to: 'https://example.com/v0.1.0',
      nodes: [['p', {}, 'First release.']]
    }])
  })

  it('never shows Unreleased, even with entries', () => {
    const releases = changelogReleases(document([['ul', {}, ['li', {}, 'Coming soon']]]))

    expect(releases.map(release => release.title)).toEqual(['v0.2.0', 'v0.1.0'])
  })
})

describe('changelogSectionIcon', () => {
  it('marks Keep a Changelog sections and contributors, and nothing else', () => {
    expect(changelogSectionIcon('Fixed')).toBe('i-lucide-bug')
    expect(changelogSectionIcon('contributors')).toBe('i-lucide-heart')
    expect(changelogSectionIcon('Notes')).toBeUndefined()
  })
})
