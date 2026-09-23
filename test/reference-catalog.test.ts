import { describe, expect, it } from 'vitest'

const catalogModule = '../layers/nuxt/report-viewer/app/utils/referenceCatalog.ts'
const {
  referenceLocation,
  referenceCitations,
  referenceCitationIndex,
  referenceLocationMatches,
  referenceRepositoryTree,
  referenceSiteTree
} = await import(catalogModule)
const repositoryModule = '../layers/nuxt/report-viewer/app/utils/repositoryTree.ts'
const { repositoryTreeNodes } = await import(repositoryModule)

const group = (target: string, kind = 'doc', title?: string, ownerTitle = 'Owner') => ({
  reference: { kind, role: 'context', target, ...(title ? { title } : {}) },
  ownerKey: '', ownerId: 'owner', ownerTitle, ownerKind: 'product'
})

describe('References catalog', () => {
  it('reads where a reference points and what it cites within it', () => {
    expect(referenceLocation('src/core/portable.ts#ProductReport')).toMatchObject({ origin: 'internal', location: 'src/core/portable.ts', anchor: '#ProductReport' })
    expect(referenceLocation('README.md:20-30')).toMatchObject({ location: 'README.md', anchor: ':20-30' })
    expect(referenceLocation('./docs/')).toMatchObject({ location: 'docs', anchor: '', directory: true })
    expect(referenceLocation('https://example.com/guide#setup')).toMatchObject({ origin: 'external', location: 'https://example.com/guide', anchor: '#setup', host: 'example.com' })
  })

  it('draws a file cited many times once, with every citation behind it', () => {
    const citations = referenceCitations([
      group('spec/format.md#coverage-md', 'spec', 'The folder contract', 'Product Model'),
      group('spec/format.md', 'spec', 'The folder contract', 'Blueprint'),
      group('src/core/portable.ts#ProductReport', 'code'),
      group('https://example.com/guide', 'doc', 'Guide')
    ])
    const tree = referenceRepositoryTree(citations)
    expect(repositoryTreeNodes(tree).map((node: any) => node.value)).toEqual(['spec', 'spec/format.md', 'src', 'src/core', 'src/core/portable.ts'])
    const index = referenceCitationIndex(citations)
    expect(index.get('spec/format.md').map((citation: any) => citation.ownerTitle)).toEqual(['Product Model', 'Blueprint'])
    expect(citations.map((citation: any) => citation.index)).toEqual([0, 1, 2, 3])
  })

  it('groups external pages once under their site, by their authored title', () => {
    const citations = referenceCitations([
      group('https://example.com/guide#a', 'doc'),
      group('https://example.com/guide#b', 'doc', 'Guide'),
      group('https://docs.example.org/api', 'spec')
    ])
    expect(referenceSiteTree(citations)).toEqual([
      { value: 'site:docs.example.org', label: 'docs.example.org', directory: true, children: [{ value: 'https://docs.example.org/api', label: 'https://docs.example.org/api', directory: false, children: [] }] },
      { value: 'site:example.com', label: 'example.com', directory: true, children: [{ value: 'https://example.com/guide', label: 'Guide', directory: false, children: [] }] }
    ])
  })

  it('groups pages on a code host by their repository, named by their path within it', () => {
    const citations = referenceCitations([
      group('https://github.com/acme/shop/blob/main/docs/guide.md', 'doc'),
      group('https://github.com/acme/shop#readme', 'doc', 'Shop README'),
      group('https://github.com/acme/tools/tree/v2/cli', 'code'),
      group('https://github.com/features', 'doc', 'Features')
    ])
    const [site] = referenceSiteTree(citations)
    expect(site.label).toBe('github.com')
    expect(site.children.map((node: any) => [node.value, node.label])).toEqual([
      ['repo:github.com/acme/shop', 'acme/shop'],
      ['repo:github.com/acme/tools', 'acme/tools'],
      ['https://github.com/features', 'Features']
    ])
    expect(site.children[0].children.map((node: any) => node.label)).toEqual(['docs/guide.md', 'Shop README'])
    expect(site.children[1].children.map((node: any) => node.label)).toEqual(['cli'])
  })

  it('finds paths and links by name, never titles', () => {
    const [citation, external] = referenceCitations([group('src/core/portable.ts', 'code', 'Portable report'), group('https://example.com/guide')])
    expect(referenceLocationMatches(citation, 'core/port')).toBe(true)
    expect(referenceLocationMatches(citation, 'portable report')).toBe(false)
    expect(referenceLocationMatches(external, 'example.com')).toBe(true)
  })
})
