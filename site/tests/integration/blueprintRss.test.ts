import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { describe, expect, it, vi } from 'vitest'
import { buildBlueprintFeed, type FeedBlueprint } from '../../server/utils/blueprintRss'

const updateDate = new Date('2026-09-05T12:00:00Z')

function blueprint(overrides: Partial<FeedBlueprint> = {}): FeedBlueprint {
  return {
    slug: 'task-tracker',
    title: 'Task tracker',
    summary: 'Capture and complete tasks.',
    category: 'productivity',
    publishedAt: new Date('2026-08-01T12:00:00Z'),
    updatedAt: new Date('2026-09-01T12:00:00Z'),
    ...overrides
  }
}

function parse(blueprints: FeedBlueprint[]) {
  const xml = buildBlueprintFeed(blueprints)
  expect(XMLValidator.validate(xml)).toBe(true)
  const { rss: { channel } } = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@',
    parseTagValue: false,
    isArray: name => name === 'item'
  }).parse(xml)
  return { channel, items: channel.item ?? [] }
}

describe('Blueprint RSS', () => {
  it('serves public metadata with canonical links and both stored dates', () => {
    const { channel, items } = parse([blueprint()])

    expect(channel.title).toBe('pdd-kit Blueprints')
    expect(channel.link).toBe('https://pdd-kit.dev/blueprints')
    expect(channel['atom:link']).toMatchObject({
      '@href': 'https://pdd-kit.dev/blueprints/rss.xml',
      '@rel': 'self',
      '@type': 'application/rss+xml'
    })
    expect(channel.lastBuildDate).toBeUndefined()
    expect(items[0]).toMatchObject({
      'title': 'Task tracker',
      'link': 'https://pdd-kit.dev/blueprints/task-tracker',
      'description': 'Capture and complete tasks.',
      'category': 'productivity',
      'pubDate': 'Sat, 01 Aug 2026 12:00:00 GMT',
      'atom:updated': '2026-09-01T12:00:00.000Z'
    })
    expect(items[0].guid).toEqual({
      '#text': 'https://pdd-kit.dev/blueprints/task-tracker',
      '@isPermaLink': 'false'
    })
  })

  it('orders by latest update, breaking ties by slug without mutating the input', () => {
    const entries = [
      blueprint({ slug: 'zebra' }),
      blueprint({ slug: 'older', updatedAt: new Date('2026-08-02T00:00:00Z') }),
      blueprint({ slug: 'alpha' })
    ]
    const { items } = parse(entries)
    expect(items.map((item: { link: string }) => item.link)).toEqual([
      'https://pdd-kit.dev/blueprints/alpha',
      'https://pdd-kit.dev/blueprints/zebra',
      'https://pdd-kit.dev/blueprints/older'
    ])
    expect(parse([...entries].reverse()).items).toEqual(items)
    expect(entries.map(entry => entry.slug)).toEqual(['zebra', 'older', 'alpha'])
  })

  it('keeps one identity across updates, named by the slug', () => {
    const original = parse([blueprint()]).items[0]
    const updated = parse([blueprint({
      summary: 'Updated summary.',
      updatedAt: updateDate
    })]).items[0]
    const other = parse([blueprint({ slug: 'habit-tracker' })]).items[0]

    expect(updated.guid).toEqual(original.guid)
    expect(updated.description).toBe('Updated summary.')
    expect(updated['atom:updated']).toBe(updateDate.toISOString())
    expect(updated.pubDate).toBe(original.pubDate)
    expect(other.guid).not.toEqual(original.guid)
  })

  it('escapes catalog text and never includes extra stored fields', () => {
    const { items } = parse([{
      ...blueprint({ title: 'Tasks & <teams>\u0000', summary: 'Café — A < B && B > C' }),
      report: { codeRefs: ['private/file.ts'] },
      sourceCommit: 'private-commit'
    } as FeedBlueprint])
    expect(items[0].title).toBe('Tasks & <teams>')
    expect(items[0].description).toBe('Café — A &lt; B &amp;&amp; B &gt; C')
    expect(JSON.stringify(items)).not.toMatch(/codeRefs|private|sourceCommit/)
  })

  it('produces a valid empty feed', () => {
    const { channel, items } = parse([])
    expect(items).toEqual([])
    expect(channel.pubDate).toBeUndefined()
    expect(channel.lastBuildDate).toBeUndefined()
  })

  it('fails rather than silently omitting malformed stored metadata', () => {
    expect(() => buildBlueprintFeed([
      blueprint(),
      blueprint({ slug: 'malformed', title: 42 as unknown as string })
    ])).toThrow()
  })

  it('keeps unchanged and empty feeds byte-identical as time passes', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-09-01T00:00:00Z'))
      const original = buildBlueprintFeed([blueprint()])
      const empty = buildBlueprintFeed([])
      vi.setSystemTime(new Date('2026-09-02T00:00:00Z'))
      expect(buildBlueprintFeed([blueprint()])).toBe(original)
      expect(buildBlueprintFeed([])).toBe(empty)
    } finally {
      vi.useRealTimers()
    }
  })
})
