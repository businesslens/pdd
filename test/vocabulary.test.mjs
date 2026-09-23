import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { stringify } from 'yaml'
import { leadsOf, readVocabulary, renderModule } from '../scripts/vocabulary.mjs'
import { VOCABULARY_ITEMS, VOCABULARY_PAGES, termHref, vocabularyMatches, vocabularyPageContext, vocabularySection } from '../layers/nuxt/report-viewer/app/utils/vocabulary.ts'

const temporaryDirectories = []

async function read(terms, group = 'Product Model') {
  const root = await mkdtemp(join(tmpdir(), 'bl-vocabulary-'))
  temporaryDirectories.push(root)
  await mkdir(join(root, 'docs'))
  const frontmatter = stringify({ title: 'Terms', group, order: 1, terms })
  await writeFile(join(root, 'docs', 'terms.md'), `---\n${frontmatter}---\n# Terms\n`)
  return readVocabulary(root)
}

async function vocabulary(terms) {
  const result = await read(terms)
  expect(result.errors).toEqual([])
  return result.terms
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('vocabulary lookup', () => {
  const results = vocabularyMatches

  it('uses the owning docs page as context, including the combined Product group', () => {
    expect(vocabularyPageContext('entities')).toBe('entity')
    expect(vocabularyPageContext('product-model')).toBe('product-model')
    expect(vocabularySection(vocabularyPageContext('product-model'))).toBe('product')
    expect(vocabularyPageContext('cli-view')).toBe('product')
    expect(vocabularyPageContext('')).toBe('product')
  })

  it('keeps term anchors and Scenario owners when docs links stay in the host', () => {
    for (const slug of ['product-model', 'capability-scenario-trigger', 'journey-scenario-trigger']) {
      expect(termHref(slug, '/docs')).toBe(termHref(slug).replace('https://businesslens.io', ''))
      expect(termHref(slug, '/docs/')).toBe(termHref(slug, '/docs'))
    }
    expect(termHref('capability-scenario-trigger', '/docs')).toContain('/capabilities#')
    expect(termHref('journey-scenario-trigger', '/docs')).toContain('/journeys#')
  })

  it('puts the requested word ahead of definitions that mention it', () => {
    expect(results(' Step ')[0].slug).toBe('step')
    expect(results('Step').some(item => item.slug === 'arc')).toBe(true)
  })

  it('ranks exact names, partial names, and meanings across pages', () => {
    const items = results('PRODUCT')
    expect(items[0].slug).toBe('product')
    expect(items.findIndex(item => item.slug === 'product-model'))
      .toBeLessThan(items.findIndex(item => item.slug === 'entity'))
  })

  it.each([
    ['Machine', 'lifecycle'],
    ['Bindings', 'applies-to'],
    ['Relationships', 'relation'],
    ['permissions', 'who-may'],
    ['Left here by', 'left-here-by'],
    ['Entities', 'entity'],
    ['Capabilities', 'capability']
  ])('finds the definition for the report label %s first', (query, slug) => {
    expect(results(query)[0].slug).toBe(slug)
  })

  it('preserves both Scenario owners when the same word is defined twice', () => {
    expect(results('Trigger').slice(0, 2).map(item => item.slug)).toEqual([
      'capability-scenario-trigger', 'journey-scenario-trigger'
    ])
  })

  it('groups every panel term exactly once without mixing Scenario definitions', () => {
    const items = results('')
    expect(items).toEqual(VOCABULARY_ITEMS)
    const pages = VOCABULARY_PAGES
    const grouped = pages.flatMap(page => [page.lead, ...page.items])
    expect(grouped.map(item => item.slug).sort()).toEqual(items.map(item => item.slug).sort())
    expect(pages.every(page => [page.lead, ...page.items].every(item => vocabularySection(item.slug) === page.page))).toBe(true)
    expect(pages.find(page => page.page === 'entities').items.map(item => item.slug))
      .toEqual(expect.arrayContaining(['actor', 'entity-kind', 'state', 'arc']))
    expect(pages.find(page => page.page === 'interfaces').items.map(item => item.slug))
      .toEqual(expect.arrayContaining(['experience', 'access-mode', 'screen', 'view-state']))
    expect(pages.find(page => page.page === 'capabilities').items.map(item => item.slug))
      .toContain('capability-scenario-trigger')
    expect(pages.find(page => page.page === 'journeys').items.map(item => item.slug))
      .toContain('journey-scenario-trigger')
  })

  it('leads every section with the term it is named for, and never repeats it as a row', () => {
    expect(VOCABULARY_PAGES.map(page => page.lead.slug)).toEqual([
      'product', 'entity', 'interface',
      'domain', 'capability', 'journey', 'business-rule', 'reference'
    ])
    expect(VOCABULARY_PAGES.every(page => !page.items.some(item => item.slug === page.lead.slug))).toBe(true)
  })

  it('leads with Product and moves every Model overview term beneath it without changing its documentation', () => {
    const product = VOCABULARY_PAGES[0]
    expect(product.page).toBe('product')
    expect(product.lead.slug).toBe('product')
    expect(product.items.map(item => item.slug)).toEqual([
      'product-model', 'intent', 'coverage', 'resource-type'
    ])
    expect(VOCABULARY_PAGES.some(page => page.page === 'product-model')).toBe(false)
    for (const item of product.items) {
      expect(vocabularySection(item.slug)).toBe('product')
      expect(item.page).toBe('product-model')
      expect(termHref(item.slug)).toContain('/product-model#')
      expect(results(item.term)[0].slug).toBe(item.slug)
    }
  })

  it('still finds a term by its meaning and returns an empty result for an unknown word', () => {
    expect(results('changes state').map(item => item.slug)).toContain('lifecycle')
    expect(results('zzzz-no-match')).toEqual([])
    expect(results(' ')).toEqual(results(''))
  })
})

describe('vocabulary generation', () => {
  it('accepts CLI pages without terms and rejects their term declarations', async () => {
    expect(await read(undefined, 'CLI')).toEqual({ terms: [], errors: [] })
    const result = await read([
      { term: 'Blueprint', definition: 'A portable Product Report.' }
    ], 'CLI')
    expect(result.terms).toEqual([])
    expect(result.errors).toEqual(['docs/terms.md CLI pages must not declare "terms"'])
  })

  it.each([
    ['Journey', 'Journeys', 'Journeies'],
    ['Capability', 'Capabilities', 'Capabilitys'],
    ['Entity', 'Entities', 'Entitys']
  ])('links the correct plural of %s', async (term, plural, misspelling) => {
    const terms = await vocabulary([
      { term, definition: 'A model term.' },
      { term: 'Collection', definition: `Several ${plural} belong here.` },
      { term: 'Typo', definition: `Several ${misspelling} belong here.` }
    ])
    const collection = terms.find(entry => entry.term === 'Collection')
    expect(collection.mentions).toEqual([{ from: 8, to: 8 + plural.length, slug: term.toLowerCase() }])
    expect(terms.find(entry => entry.term === 'Typo').mentions).toEqual([])
  })

  it('also resolves vowel-y plurals of aliases', async () => {
    const terms = await vocabulary([
      { term: 'Journey', aliases: ['Pathway'], definition: 'A model term.' },
      { term: 'Collection', definition: 'Several Pathways belong here.' }
    ])
    expect(terms.find(entry => entry.term === 'Collection').mentions).toEqual([
      { from: 8, to: 16, slug: 'journey' }
    ])
  })

  it('leads a page with its first term and refuses a shared word there', async () => {
    const terms = await vocabulary([
      { term: 'Journey', definition: 'A model term.' },
      { term: 'Trigger', on: 'journey', definition: 'What starts one.' }
    ])
    expect([...leadsOf(terms)]).toEqual([['terms', 'journey']])
    expect(renderModule(terms)).toContain('"terms": "journey"')

    const { errors } = await read([
      { term: 'Trigger', on: 'journey', definition: 'What starts one.' },
      { term: 'Journey', definition: 'A model term.' }
    ])
    expect(errors).toEqual([expect.stringContaining('is the page\'s lead and cannot be scoped with "on"')])
  })
})
