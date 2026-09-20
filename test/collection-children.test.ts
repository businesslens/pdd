import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'

const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const { projectReportWorkspace } = await utility('reportWorkspace')
const { rowChildren, treeCards, structureChildren, treeBranchKeys, TREE_CARD_KINDS } = await utility('collectionChildren')
const { tabsFor } = await utility('pageSections')
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
      expect(card.children.map((group: any) => group.title)).toEqual(
        [['capability', 'Capabilities'], ['entity', 'Entities']]
          .filter(([kind]) => rowChildren(workspace, card.resource).some((row: any) => row.resource.kind === kind)).map(([, title]) => title))
      expect(card.children.flatMap((group: any) => group.children.map((node: any) => node.resource.key)).sort())
        .toEqual(rowChildren(workspace, card.resource).map((row: any) => row.resource.key).sort())
    }
    /* An Interface card groups its Experiences, each with its Screens, and its direct Screens. */
    for (const card of treeCards(workspace, 'interface', workspace.interfaces, false)) {
      expect(card.children.map((group: any) => group.title)).toEqual(
        [['experience', 'Experiences'], ['screen', rowChildren(workspace, card.resource).some((row: any) => row.resource.kind === 'experience') ? 'Shared Screens' : 'Screens']]
          .filter(([kind]) => rowChildren(workspace, card.resource).some((row: any) => row.resource.kind === kind)).map(([, title]) => title))
      const screens = flatten(card.children).filter((node: any) => node.resource?.kind === 'screen').map((node: any) => node.resource.key)
      expect(screens.sort()).toEqual(flatten(rowChildren(workspace, card.resource)).filter((row: any) => row.resource.kind === 'screen').map((row: any) => row.resource.key).sort())
    }
    for (const kind of ['entity', 'rule']) {
      for (const resource of workspace.byKey.values()) if (resource.kind === kind) expect(rowChildren(workspace, resource)).toEqual([])
    }
  })

  it('omits empty folders while keeping the resource card and populated Unassigned groups', () => {
    const empty = { ...workspace, capabilities: [], entities: [], experiences: [], screens: [] }
    const domains = treeCards(empty, 'domain', empty.domains, false)
    expect(domains.map((card: any) => card.key)).toEqual(empty.domains.map((domain: any) => domain.key))
    for (const card of domains) {
      expect(card.children).toEqual([])
      expect(card.resource).toBeDefined()
    }
    const interfaces = treeCards(empty, 'interface', empty.interfaces, false)
    expect(interfaces.map((card: any) => card.key)).toEqual(empty.interfaces.map((iface: any) => iface.key))
    for (const card of interfaces) {
      expect(card.children).toEqual([])
      expect(card.resource).toBeDefined()
    }
    const unassignedEntity = { ...workspace.entities[0], domainId: null }
    const partlyUnassigned = { ...empty, entities: [unassignedEntity] }
    const unassigned = treeCards(partlyUnassigned, 'domain', empty.domains, false).at(-1)
    expect(unassigned.key).toBe('unassigned')
    expect(unassigned.children.map((group: any) => [group.title, group.children.length]))
      .toEqual([['Entities', 1]])
    expect(unassigned.children[0].children[0].resource).toBe(unassignedEntity)
    expect(treeCards(partlyUnassigned, 'domain', empty.domains, true).some((card: any) => card.key === 'unassigned')).toBe(false)
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

  it('uses the identical containment tree in an Interface card and its Structure tab', () => {
    for (const card of treeCards(workspace, 'interface', workspace.interfaces, false)) {
      expect(structureChildren(workspace, card.resource)).toEqual(card.children)
      const nodes = flatten(card.children)
      expect(nodes.some(node => node.sharedFrom)).toBe(false)
      expect(new Set(nodes.map(node => node.id)).size).toBe(nodes.length)
      expect(treeBranchKeys(card.children)).toEqual(nodes.filter(node => node.children.length).map(node => node.id))
      expect(tabsFor(workspace, card.resource).map((tab: any) => tab.id).includes('structure')).toBe(card.children.length > 0)
    }
  })

  it('shows an Experience’s own Screens and shared references without changing ownership', () => {
    const experience = workspace.experiences.find((item: any) => item.id === 'reader-web::personal-library')
    const groups = structureChildren(workspace, experience)
    expect(groups.map((group: any) => [group.title, group.children.length])).toEqual([['Screens', 4], ['Shared Screens', 1]])
    expect(groups[0].children.every((node: any) => !node.sharedFrom)).toBe(true)
    const shared = groups[1].children[0]
    expect(shared.resource.title).toBe('Item reader')
    expect(shared.sharedFrom.title).toBe('Reader web application')
    expect(shared.resource.experienceIds).toEqual([])
    const owner = shared.sharedFrom
    const canonical = flatten(structureChildren(workspace, owner)).filter((node: any) => node.resource?.key === shared.resource.key)
    expect(canonical).toHaveLength(1)
    expect(canonical[0].sharedFrom).toBeUndefined()
    expect(tabsFor(workspace, experience).map((tab: any) => tab.id)).toEqual(['overview', 'structure', 'connections'])
    expect(structureChildren(workspace, shared.resource)).toEqual([])
    expect(tabsFor(workspace, shared.resource).map((tab: any) => tab.id)).not.toContain('structure')
  })

  it('omits Structure and its empty groups on childless places', () => {
    const empty = { ...workspace, experiences: [], screens: [] }
    for (const resource of [...workspace.interfaces, ...workspace.experiences]) {
      expect(structureChildren(empty, resource)).toEqual([])
      expect(tabsFor(empty, resource).map((tab: any) => tab.id)).not.toContain('structure')
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
