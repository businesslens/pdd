import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'

const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const { projectReportWorkspace } = await utility('reportWorkspace')
const { rowChildren, treeCards, TREE_CARD_KINDS } = await utility('collectionChildren')
const { interfaceProjection } = await utility('topologyProjections')
const workspace = projectReportWorkspace(compileReport(loadModel(join(__dirname, '../blueprints/content-feed-reader')), '2026-09-12'))
const flatten = (rows: any[]): any[] => rows.flatMap(row => [row, ...flatten(row.children)])

describe('collection rows that expand', () => {
  it('draws Interfaces and Domains as tree cards, and every other collection as plain rows', () => {
    expect(TREE_CARD_KINDS).toEqual(['interface', 'domain'])
    for (const kind of ['entity', 'capability', 'journey', 'rule']) {
      for (const resource of workspace.byKey.values()) if (resource.kind === kind) expect(rowChildren(workspace, resource)).toEqual([])
    }
    /* A Domain card groups Capabilities then Entities; the grid ends with what
       no Domain claims, unless a filter narrowed it. */
    const domainCards = treeCards(workspace, 'domain', workspace.domains, false)
    expect(domainCards.map((card: any) => card.key)).toEqual([...workspace.domains.map((item: any) => item.key), ...(workspace.capabilities.some((item: any) => !item.domainId) || workspace.entities.some((item: any) => !item.domainId) ? ['unassigned'] : [])])
    expect(treeCards(workspace, 'domain', workspace.domains, true).some((card: any) => card.key === 'unassigned')).toBe(false)
    for (const card of domainCards.filter((item: any) => item.resource)) {
      expect(card.children.map((group: any) => group.title)).toEqual(['Capabilities', 'Entities'].filter(title => card.children.some((group: any) => group.title === title)))
      expect(card.children.flatMap((group: any) => group.children.map((node: any) => node.resource.key)).sort())
        .toEqual(rowChildren(workspace, card.resource).map((row: any) => row.resource.key).sort())
    }
    /* An Interface card groups its Experiences, each with its Screens, and its direct Screens. */
    for (const card of treeCards(workspace, 'interface', workspace.interfaces, false)) {
      const screens = flatten(card.children).filter((node: any) => node.resource?.kind === 'screen').map((node: any) => node.resource.key)
      expect(screens.sort()).toEqual(flatten(rowChildren(workspace, card.resource)).filter((row: any) => row.resource.kind === 'screen').map((row: any) => row.resource.key).sort())
    }
    for (const kind of ['entity', 'rule']) {
      for (const resource of workspace.byKey.values()) if (resource.kind === kind) expect(rowChildren(workspace, resource)).toEqual([])
    }
  })

  it('files each Screen once under its Interface, inside its Experience where it has one', () => {
    for (const iface of workspace.interfaces) {
      const rows = rowChildren(workspace, iface)
      const screens = flatten(rows).filter(row => row.resource.kind === 'screen').map(row => row.resource.key)
      expect(new Set(screens).size).toBe(screens.length)
      const drawn = flatten(interfaceProjection(workspace).find((item: any) => item.id === iface.key).children)
        .filter((item: any) => item.resource?.kind === 'screen').map((item: any) => item.resource.key)
      expect(screens.sort()).toEqual(drawn.sort())
      for (const row of rows) {
        if (row.resource.kind === 'experience') expect(row.children.every((child: any) => child.resource.kind === 'screen')).toBe(true)
      }
    }
  })

  it('lists a Domain as its Capabilities and then its Entities, as the Domain map grouped them', () => {
    for (const domain of workspace.domains) {
      const rows = rowChildren(workspace, domain)
      const kinds = rows.map((row: any) => row.resource.kind)
      expect(kinds.indexOf('entity')).toBeGreaterThanOrEqual(kinds.lastIndexOf('capability') === -1 ? 0 : kinds.lastIndexOf('capability'))
      expect(rows.filter((row: any) => row.resource.kind === 'capability').map((row: any) => row.resource.id))
        .toEqual(workspace.capabilities.filter((item: any) => item.domainId === domain.id).map((item: any) => item.id))
      expect(rows.filter((row: any) => row.resource.kind === 'entity').map((row: any) => row.resource.id))
        .toEqual(workspace.entities.filter((item: any) => item.domainId === domain.id).map((item: any) => item.id))
    }
  })
})
