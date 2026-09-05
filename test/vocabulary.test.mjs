import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { stringify } from 'yaml'
import { readVocabulary, renderDoc, renderModule } from '../scripts/vocabulary.mjs'

const temporaryDirectories = []

async function vocabulary(terms, title = 'Terms') {
  const root = await mkdtemp(join(tmpdir(), 'bl-vocabulary-'))
  temporaryDirectories.push(root)
  await mkdir(join(root, 'docs'))
  const frontmatter = stringify({ title, group: 'Product Model', order: 1, terms })
  await writeFile(join(root, 'docs', 'terms.md'), `---\n${frontmatter}---\n# Terms\n`)
  const result = await readVocabulary(root)
  expect(result.errors).toEqual([])
  return result.terms
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(root => rm(root, { recursive: true, force: true })))
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
