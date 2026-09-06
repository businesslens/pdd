import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { stringify } from 'yaml'
import { leadsOf, readVocabulary, renderDoc, renderModule } from '../scripts/vocabulary.mjs'
import { VOCABULARY_ITEMS, VOCABULARY_PAGES, vocabularyMatches, vocabularySection } from '../layers/nuxt/report-viewer/app/utils/vocabulary.ts'

const temporaryDirectories = []

async function read(terms, title = 'Terms') {
  const root = await mkdtemp(join(tmpdir(), 'bl-vocabulary-'))
  temporaryDirectories.push(root)
  await mkdir(join(root, 'docs'))
  const frontmatter = stringify({ title, group: 'Product Model', order: 1, terms })
  await writeFile(join(root, 'docs', 'terms.md'), `---\n${frontmatter}---\n# Terms\n`)
  return readVocabulary(root)
}

async function vocabulary(terms, title = 'Terms') {
  const result = await read(terms, title)
  expect(result.errors).toEqual([])
  return result.terms
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('vocabulary lookup', () => {
  const results = vocabularyMatches

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

  it('preserves both Scenario owners when the same word is defined twice', () => {
    expect(results('Trigger').slice(0, 2).map(item => item.slug)).toEqual([
      'capability-scenario-trigger', 'journey-scenario-trigger'
    ])
  })

  it('keeps CLI definitions in the documentation and registry, outside panel browse and search', async () => {
    const { terms, errors } = await readVocabulary(fileURLToPath(new URL('../', import.meta.url)))
    expect(errors).toEqual([])
    const doc = renderDoc(terms)
    expect(doc).toContain('## CLI')
    const browse = VOCABULARY_PAGES.flatMap(page => [page.lead, ...page.items])

    for (const [slug, term, page] of [
      ['product-report', 'Product Report', 'cli-export'],
      ['blueprint', 'Blueprint', 'cli-contribute']
    ]) {
      const source = terms.find(entry => entry.slug === slug)
      expect(source).toMatchObject({ term, page, group: 'CLI' })
      expect(doc).toContain(`| **${term}** |`)
      expect(doc).toContain(`./${page}.md#${source.anchor}`)
      expect(VOCABULARY_ITEMS.find(item => item.slug === slug))
        .toMatchObject({ term, page, definition: source.definition })
      expect(browse.some(item => item.slug === slug)).toBe(false)
      for (const query of ['', term, 'report', 'portable', 'catalog']) {
        expect(results(query).some(item => item.slug === slug)).toBe(false)
      }
    }
  })

  it('groups every panel term exactly once without mixing Scenario definitions', () => {
    const items = results('')
    const pages = VOCABULARY_PAGES
    const grouped = pages.flatMap(page => [page.lead, ...page.items])
    expect(grouped.map(item => item.slug).sort()).toEqual(items.map(item => item.slug).sort())
    expect(pages.every(page => [page.lead, ...page.items].every(item => vocabularySection(item.slug) === page.page))).toBe(true)
    expect(pages.find(page => page.page === 'entities').items.map(item => item.slug))
      .toEqual(expect.arrayContaining(['actor', 'entity-kind', 'state', 'arc']))
    expect(pages.find(page => page.page === 'capabilities').items.map(item => item.slug))
      .toContain('capability-scenario-trigger')
    expect(pages.find(page => page.page === 'journeys').items.map(item => item.slug))
      .toContain('journey-scenario-trigger')
  })

  it('leads every section with the term it is named for, and never repeats it as a row', () => {
    expect(VOCABULARY_PAGES.map(page => page.lead.slug)).toEqual([
      'product', 'entity', 'interface', 'experience', 'screen',
      'domain', 'capability', 'journey', 'business-rule', 'reference'
    ])
    expect(VOCABULARY_PAGES.every(page => !page.items.some(item => item.slug === page.lead.slug))).toBe(true)
  })

  it('leads with Product and moves every Model overview term beneath it without changing its documentation', () => {
    const product = VOCABULARY_PAGES[0]
    expect(product.page).toBe('product')
    expect(product.lead.slug).toBe('product')
    expect(product.items.map(item => item.slug)).toEqual([
      'product-model', 'intent', 'coverage', 'resource-type', 'topology', 'neighbourhood'
    ])
    expect(VOCABULARY_PAGES.some(page => page.page === 'product-model')).toBe(false)
    for (const item of product.items) {
      expect(vocabularySection(item.slug)).toBe('product')
      expect(item.page).toBe('product-model')
      expect(item.href).toContain('/product-model#')
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
    expect(renderDoc(terms)).toContain(`Several [${plural}](./terms.md) belong here.`)
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

  it('escapes pipes in every table cell and linked text without changing registry definitions', async () => {
    const definition = 'Pick A | B before a Journey.'
    const terms = await vocabulary([
      { term: 'Journey', definition: 'A model term.' },
      { term: 'Choice | route', definition },
      { term: 'Selection', definition: 'Use a Choice | route.' }
    ], 'Terms | examples')
    const doc = renderDoc(terms)
    expect(doc).toContain(String.raw`| **Choice \| route** | Pick A \| B before a [Journey](./terms.md). | [Terms \| examples](./terms.md) |`)
    expect(doc).toContain(String.raw`| **Selection** | Use a [Choice \| route](./terms.md). | [Terms \| examples](./terms.md) |`)
    expect(terms.find(entry => entry.term === 'Choice | route').definition).toBe(definition)
    expect(renderModule(terms)).toContain(`definition: ${JSON.stringify(definition)}`)
  })

  it('preserves literal backslashes before pipes and Markdown punctuation', async () => {
    const terms = await vocabulary([
      { term: 'Notation', definition: String.raw`Use A \| B with [brackets] and *stars*.` }
    ])
    expect(renderDoc(terms)).toContain(String.raw`Use A \\\| B with \[brackets\] and \*stars\*.`)
  })
})
