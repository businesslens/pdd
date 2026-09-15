import { describe, expect, it } from 'vitest'

const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const { diagramBounds, diagramContext } = await utility('diagramInteraction')

const node = (id: string, resourceKey = id) => ({ id, title: id, resourceKey })
const edge = (source: string, target: string) => ({ id: `${source}->${target}`, source, target, label: '' })
const tree = {
  layout: 'tree',
  nodes: ['product', 'interface', 'experience', 'screen', 'sibling', 'other-interface'].map(id => node(id)),
  edges: [edge('product', 'interface'), edge('product', 'other-interface'), edge('interface', 'experience'), edge('experience', 'screen'), edge('experience', 'sibling')]
}

describe('diagram context', () => {
  it('keeps a Screen’s complete ancestor path without highlighting its siblings', () => {
    const context = diagramContext(tree, 'screen')
    expect(context.nodes).toEqual(new Set(['product', 'interface', 'experience', 'screen']))
    expect(context.edges).toEqual(new Set(['product->interface', 'interface->experience', 'experience->screen']))
  })

  it('includes every visible descendant of a container and its ancestor path', () => {
    const context = diagramContext(tree, 'experience')
    expect(context.nodes).toEqual(new Set(['product', 'interface', 'experience', 'screen', 'sibling']))
    expect(context.edges).toEqual(new Set(['product->interface', 'interface->experience', 'experience->screen', 'experience->sibling']))
    expect(diagramContext(tree, 'product').nodes.size).toBe(tree.nodes.length)
  })

  it('links repeated resources by identity, including both paths, without matching titles', () => {
    const repeated = {
      layout: 'tree',
      nodes: [node('product'), node('domain-a'), node('domain-b'),
        { ...node('first', 'capability:shared'), title: 'Same title' },
        { ...node('second', 'capability:shared'), title: 'Same title' },
        { ...node('unrelated', 'capability:other'), title: 'Same title' }],
      edges: [edge('product', 'domain-a'), edge('product', 'domain-b'), edge('domain-a', 'first'), edge('domain-b', 'second'), edge('domain-b', 'unrelated')]
    }
    const context = diagramContext(repeated, 'first')
    expect(context.occurrences).toEqual(new Set(['first', 'second']))
    expect(context.nodes).toEqual(new Set(['product', 'domain-a', 'domain-b', 'first', 'second']))
    expect(context.edges.has('domain-b->unrelated')).toBe(false)
  })

  it('keeps Entity relationships to one hop, including incoming, parallel and self edges', () => {
    const context = diagramContext({
      nodes: ['a', 'b', 'c', 'd', 'isolated'].map(id => node(id)),
      edges: [edge('a', 'b'), edge('c', 'a'), edge('b', 'd'), edge('b', 'c'), edge('a', 'a'), { ...edge('a', 'b'), id: 'parallel' }]
    }, 'a')
    expect(context.nodes).toEqual(new Set(['a', 'b', 'c']))
    expect(context.edges).toEqual(new Set(['a->b', 'c->a', 'a->a', 'parallel']))
  })

  it('clears context for a removed node and handles an isolated node', () => {
    expect(diagramContext(tree, null)).toBeNull()
    expect(diagramContext(tree, 'removed')).toBeNull()
    const context = diagramContext({ nodes: [node('alone')], edges: [] }, 'alone')
    expect(context.nodes).toEqual(new Set(['alone']))
    expect(context.edges.size).toBe(0)
  })
})

describe('diagram centering bounds', () => {
  it('includes newly laid-out children and unequal node sizes without browser measurements', () => {
    const root = { ...node('root'), x: 10, y: 20, width: 236, height: 66 }
    const child = { ...node('child'), x: -100, y: 162, width: 132, height: 48 }
    expect(diagramBounds({ nodes: [root] })).toEqual({ x: 10, y: 20, width: 236, height: 66 })
    expect(diagramBounds({ nodes: [root, child] })).toEqual({ x: -100, y: 20, width: 346, height: 190 })
  })

  it('handles an empty layout', () => {
    expect(diagramBounds({ nodes: [] })).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })
})
