import { expect, test } from '@playwright/test'
import { XMLParser, XMLValidator } from 'fast-xml-parser'

/**
 * The Blueprint feed is generated with the site from the repository's
 * `blueprints/`: one item per Blueprint, newest change first. `blueprintRss`
 * unit tests cover the builder; this covers the generated file against the
 * Blueprint files generated beside it.
 */

const ORIGIN = 'https://pdd-kit.dev'

interface FeedItem {
  'title': string
  'link': string
  'description': string
  'category': string
  'pubDate': string
  'atom:updated': string
  'guid': { '#text': string, '@isPermaLink': string }
}

interface BlueprintIndex {
  blueprints: Array<{ slug: string, title: string, report: string }>
}

type BlueprintDates = Record<string, { publishedAt: string, updatedAt: string | null }>

test('the Blueprint feed is valid RSS with one item per Blueprint, newest change first', async ({ request }) => {
  const response = await request.get('/blueprints/rss.xml')
  expect(response.status()).toBe(200)
  // A static file: its content type is the host's to set, but it is XML.
  expect(response.headers()['content-type']).toMatch(/^application\/(rss\+)?xml\b/)

  const xml = await response.text()
  expect(XMLValidator.validate(xml)).toBe(true)
  const parsed = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@',
    parseTagValue: false,
    isArray: name => name === 'item'
  }).parse(xml)
  const channel = parsed.rss.channel
  expect(parsed.rss['@version']).toBe('2.0')
  expect(channel.link).toBe(`${ORIGIN}/blueprints`)
  expect(channel['atom:link']['@href']).toBe(`${ORIGIN}/blueprints/rss.xml`)
  expect(channel['atom:link']['@rel']).toBe('self')
  // A channel date that changes on every build would tell readers it changed.
  expect(channel.lastBuildDate).toBeUndefined()

  const items = channel.item as FeedItem[]
  const { blueprints } = await (await request.get('/_blueprints/index.json')).json() as BlueprintIndex
  const dates = await (await request.get('/_blueprints/dates.json')).json() as BlueprintDates
  expect(blueprints).toHaveLength(15)
  expect(items).toHaveLength(blueprints.length)

  // Every Blueprint once, linked at its public page, and identified by it: the
  // slug is its directory, its page and its pull name.
  expect(items.map(item => item.link).sort()).toEqual(
    blueprints.map(blueprint => `${ORIGIN}/blueprints/${blueprint.slug}`).sort()
  )
  for (const item of items) {
    const slug = new URL(item.link).pathname.split('/').at(-1)!
    const blueprint = blueprints.find(entry => entry.slug === slug)!
    expect(item.title, slug).toBe(blueprint.title)
    expect(item.guid, slug).toEqual({ '#text': `${ORIGIN}/blueprints/${slug}`, '@isPermaLink': 'false' })
    expect(item.description, slug).toBeTruthy()
    expect(item.category, slug).toBeTruthy()

    const { publishedAt, updatedAt } = dates[slug]!
    expect(item.pubDate, slug).toBe(new Date(publishedAt).toUTCString())
    expect(item['atom:updated'], slug).toBe(new Date(updatedAt ?? publishedAt).toISOString())
  }

  // Newest change first, ties in slug order so the file is stable between builds.
  const order = items.map(item => ({
    slug: new URL(item.link).pathname.split('/').at(-1)!,
    updated: Date.parse(item['atom:updated'])
  }))
  const sorted = [...order].sort((a, b) => (
    b.updated - a.updated || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0)
  ))
  expect(order.map(item => item.slug)).toEqual(sorted.map(item => item.slug))

  // Each item's page exists in the generated site.
  for (const item of items) {
    const page = await request.get(new URL(item.link).pathname)
    expect(page.status(), item.link).toBe(200)
  }
})
