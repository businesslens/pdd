import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'

const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const { projectReportWorkspace } = await utility('reportWorkspace')
const { sitemapProjection } = await utility('topologyProjections')
const { layoutTopologyTree } = await utility('topologyTree')
const flatten = (tree: any): any[] => [tree, ...tree.children.flatMap(flatten)]
const epsilon = 0.001

function verifyTree(tree: any) {
  const source = flatten(tree)
  const sizes = Object.fromEntries(source.map((node, index) => [node.id, { width: 200, height: 70 + (index % 4) * 25 }]))
  const graph = layoutTopologyTree(tree, sizes)
  const positions = new Map<string, any>(graph.nodes.map((node: any) => [node.id, node]))
  expect(graph.nodes.map((node: any) => node.id)).toEqual(source.map(node => node.id))
  expect(graph.branches.flatMap((branch: any) => branch.children).length).toBe(source.length - 1)
  for (const [index, node] of graph.nodes.entries()) {
    expect(node.x).toBeGreaterThanOrEqual(0)
    expect(node.y).toBeGreaterThanOrEqual(0)
    expect(node.x + node.width).toBeLessThanOrEqual(graph.width + epsilon)
    expect(node.y + node.height).toBeLessThanOrEqual(graph.height + epsilon)
    for (const other of graph.nodes.slice(index + 1)) {
      const overlap = node.x < other.x + other.width && other.x < node.x + node.width && node.y < other.y + other.height && other.y < node.y + node.height
      expect(overlap, `${node.id} overlaps ${other.id}`).toBe(false)
      if (node.depth === other.depth) expect(node.y).toBe(other.y)
    }
  }
  for (const parent of source.filter(node => node.children.length)) {
    const box = positions.get(parent.id)!
    const children = parent.children.map((node: any) => positions.get(node.id)!)
    const centers = children.map((node: any) => node.x + node.width / 2)
    expect(centers).toEqual([...centers].sort((a, b) => a - b))
    expect(box.x + box.width / 2).toBeCloseTo((centers[0] + centers.at(-1)!) / 2)
    const branch = graph.branches.find((item: any) => item.source === parent.id)
    expect(branch.children.map((child: any) => child.target)).toEqual(parent.children.map((child: any) => child.id))
    for (const child of branch.children) {
      const target = positions.get(child.target)!
      expect(target.depth).toBe(box.depth + 1)
      expect(child.points[0]).toEqual({ x: box.x + box.width / 2, y: box.y + box.height })
      expect(child.points.at(-1)).toEqual({ x: target.x + target.width / 2, y: target.y })
      for (let index = 1; index < child.points.length; index++) {
        const a = child.points[index - 1], b = child.points[index]
        expect(a.x === b.x || a.y === b.y).toBe(true)
        for (const obstacle of graph.nodes.filter((node: any) => node.id !== parent.id && node.id !== child.target)) {
          const crosses = a.x === b.x
            ? a.x > obstacle.x && a.x < obstacle.x + obstacle.width && Math.max(a.y, b.y) > obstacle.y && Math.min(a.y, b.y) < obstacle.y + obstacle.height
            : a.y > obstacle.y && a.y < obstacle.y + obstacle.height && Math.max(a.x, b.x) > obstacle.x && Math.min(a.x, b.x) < obstacle.x + obstacle.width
          expect(crosses, `${parent.id} → ${child.target} enters ${obstacle.id}`).toBe(false)
        }
      }
    }
  }
  expect(layoutTopologyTree(tree, sizes)).toEqual(graph)
}

describe('connected Sitemap tree', () => {
  it.each(['.', 'blueprints/content-feed-reader', 'test/fixtures/fixture-shop'])('connects the complete qualified containment hierarchy: %s', root => {
    const workspace = projectReportWorkspace(compileReport(loadModel(join(__dirname, '..', root)), '2026-09-07'))
    const tree = sitemapProjection(workspace)
    expect(tree.id).toBe(`product:${workspace.identity.id}`)
    expect(tree.title).toBe(workspace.identity.title)
    expect(tree.children.map((node: any) => node.id)).toEqual(workspace.interfaces.map((resource: any) => resource.key))
    const nodes = flatten(tree)
    expect(new Set(nodes.map(node => node.id))).toEqual(new Set([tree.id, ...[...workspace.byKey.values()].filter((resource: any) => ['interface', 'experience', 'screen'].includes(resource.kind)).map((resource: any) => resource.key)]))
    if (root === '.') {
      expect(nodes.length).toBe(7)
      expect(tree.children.filter((node: any) => !node.children.length).length).toBe(2)
      expect(tree.children.flatMap((node: any) => node.children).map((node: any) => node.resource.kind)).toEqual(['screen', 'screen', 'screen'])
    }
    verifyTree(tree)
  })
  it('keeps a single root and uneven deep/wide branches readable', () => {
    verifyTree({ id: 'root', children: [] })
    verifyTree({ id: 'root', children: [
      { id: 'empty', children: [] },
      { id: 'wide', children: Array.from({ length: 12 }, (_, index) => ({ id: `child-${index}`, children: [{ id: `leaf-${index}`, children: [] }] })) },
      { id: 'direct', children: [{ id: 'screen', children: [] }] }
    ] })
  })
})
