import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const { projectReportWorkspace } = await utility('reportWorkspace')
const { REPORT_DESTINATIONS, MAIN_RESOURCE_KINDS, resourceAncestors, destinationForLocation, collectionKindFor, resourceViewLinks } = await utility('reportDestinations')
const { findProductTopologyView } = await utility('productTopologyViews')
const { resourceConnectionRows } = await utility('resourceConnections')
const { tabsFor } = await utility('pageSections')
const { topologyRelations } = await utility('topologyRelations')
const { ruleAttachments } = await utility('topologyTargets')
const { interfaceProjection } = await utility('topologyProjections')
const workspace = projectReportWorkspace(compileReport(loadModel(join(__dirname, '../test/fixtures/fixture-shop')), '2026-09-08'))

describe('report destinations', () => {
  it('gives every drawing one collection home, with matrices owned by their row subject', () => {
    expect(MAIN_RESOURCE_KINDS).toEqual(['entity', 'interface', 'domain', 'capability', 'journey', 'rule'])
    const homes = new Set<string>(MAIN_RESOURCE_KINDS)
    const matrices = REPORT_DESTINATIONS.filter((item: any) => item.mode === 'matrix')
    expect(matrices.map((item: any) => [item.rail, item.view])).toEqual([
      ['capability', 'delivery-by-interface'], ['entity', 'what-changes-what'], ['rule', 'rule-attachments']
    ])
    for (const item of REPORT_DESTINATIONS) {
      expect(homes.has(item.rail), `${item.section} has no home`).toBe(true)
      expect(destinationForLocation(item.rail, item.mode)?.section).toBe(item.section)
      expect(findProductTopologyView(item.view).question).toBeTruthy()
    }
    for (const rail of homes) {
      const modes = REPORT_DESTINATIONS.filter((item: any) => item.rail === rail).map((item: any) => item.mode)
      expect(modes, rail).toEqual(['entity', 'capability', 'rule'].includes(rail) ? ['graph', 'matrix'] : ['graph'])
    }
  })

  it('does not keep standalone matrix sections or offer matrices to other collections', () => {
    for (const section of ['topology', 'delivery', 'what-changes-what', 'rule-attachments']) {
      expect(destinationForLocation(section, 'overview')).toBeUndefined()
    }
    for (const kind of ['interface', 'domain', 'journey']) expect(destinationForLocation(kind, 'matrix')).toBeUndefined()
  })

  it('finds the owning collection of children and derives actual ownership', () => {
    for (const resource of [...workspace.experiences, ...workspace.screens]) {
      expect(collectionKindFor(resource.kind)).toBe('interface')
      const parents = resourceAncestors(workspace, resource)
      expect(parents[0].kind).toBe('interface')
      if (resource.kind === 'screen') expect(parents.length).toBe(resource.contexts[0].experienceId ? 2 : 1)
    }
  })

  it('offers a resource only the views its own subject appears in', () => {
    const sections = (resource: any) => resourceViewLinks(resource, workspace).map((item: any) => item.section)
    expect(sections(workspace.entities[0])).toContain('entity-relationships')
    expect(sections(workspace.interfaces[0])).toEqual(expect.arrayContaining(['interface-map', 'delivery']))
    expect(sections(workspace.domains[0])).toContain('domain-reach')
    expect(sections(workspace.journeys[0])).toContain('journey-reach')
    expect(sections(workspace.rules[0])).toEqual(['rule-reach', 'rule-attachments'])
    for (const resource of workspace.byKey.values()) {
      for (const section of sections(resource)) {
        /* An exit leads somewhere that exists, and never back to itself. */
        const destination = REPORT_DESTINATIONS.find((item: any) => item.section === section)
        expect(destination, `${resource.key} exits to ${section}`).toBeTruthy()
        expect(findProductTopologyView(destination.view).kinds).toContain(resource.kind)
      }
    }
  })
})

describe('resource readings', () => {
  it('does not reverse a Screen exposing Capabilities or an Entity declaring a relation', () => {
    const screen = workspace.screens.find((item: any) => item.capabilityIds.length)
    expect(resourceConnectionRows(workspace, screen).find((row: any) => row.label === 'Capabilities').direction).toBe('Outgoing')
    const entity = workspace.entities.find((item: any) => item.relations.length)
    const custom = { ...entity, relations: [{ ...entity.relations[0], verb: 'Actors' }] }
    expect(resourceConnectionRows(workspace, custom).find((row: any) => row.label.startsWith('Actors ')).direction).toBe('Outgoing')
    const related = workspace.byKey.get(`entity:${entity.relations[0].entityId}`)
    expect(resourceConnectionRows(workspace, related).some((row: any) => row.kind === 'entity' && row.direction === 'Incoming' && row.ids.includes(entity.id))).toBe(true)
  })
  it('keeps every available Capability reachable through Interface delivery', () => {
    const collect = (node: any): string[] => [node.resource?.key, ...node.references.map((item: any) => item.key), ...node.children.flatMap(collect)].filter(Boolean)
    for (const branch of interfaceProjection(workspace, true)) {
      const shown = new Set(collect(branch))
      const resource = workspace.byKey.get(branch.id)
      for (const capability of resource.capabilityIds) expect(shown.has(`capability:${capability}`), `${branch.id}: ${capability}`).toBe(true)
      if (resource.screenIds.length) expect(resourceConnectionRows(workspace, resource).map((row: any) => row.label)).toContain('Screens available')
    }
  })

  it('includes relationships also explained in Overview in the complete Connections reading', () => {
    for (const resource of [...workspace.interfaces, ...workspace.experiences]) {
      const rows = resourceConnectionRows(workspace, resource)
      expect(rows.find((row: any) => row.label === 'Actors').ids).toEqual(resource.actorIds)
      if (resource.screenIds.length) expect(rows.find((row: any) => row.label === 'Screens available').ids).toEqual(resource.screenIds)
      if (resource.capabilityIds.length) expect(rows.find((row: any) => row.label === 'Capabilities available').ids).toEqual(resource.capabilityIds)
    }
    for (const resource of [...workspace.entities, ...workspace.capabilities]) {
      const rows = resourceConnectionRows(workspace, resource)
      if (resource.domainId) expect(rows.find((row: any) => row.label === 'Domain').ids).toEqual([resource.domainId])
      if (resource.kind === 'capability' && resource.entityIds.length) {
        expect(rows.find((row: any) => row.label === 'Changes')).toMatchObject({ ids: resource.entityIds, derived: true })
      }
    }
    for (const rule of workspace.rules) {
      const targets = resourceConnectionRows(workspace, rule).flatMap((row: any) => row.ids.map((id: string) => `${row.kind}:${id}`))
      for (const attachment of ruleAttachments(workspace, rule)) expect(targets, rule.key).toContain(attachment.resource.key)
    }
    // Every direct topology neighbor remains discoverable from either endpoint.
    for (const relation of topologyRelations(workspace)) {
      for (const [key, target] of [[relation.source, relation.target], [relation.target, relation.source]]) {
        const rows = resourceConnectionRows(workspace, workspace.byKey.get(key))
        expect(rows.flatMap((row: any) => row.ids.map((id: string) => `${row.kind}:${id}`)), key).toContain(target)
      }
    }
  })

  it('omits Connections for a resource with no relationships', () => {
    const resource = { ...workspace.entities[0], key: 'entity:isolated', id: 'isolated', states: [], domainId: '', references: [],
      relations: [], inboundRelations: [], changedByIds: [], readByIds: [], presentedOnIds: [], ruleIds: [],
      interfaceIds: [], experienceIds: [], journeyIds: [] }
    const isolated = { ...workspace, byKey: new Map([[resource.key, resource]]) }
    expect(resourceConnectionRows(isolated, resource)).toEqual([])
    expect(tabsFor(isolated, resource).map((tab: any) => tab.id)).toEqual(['overview'])
  })

  it('keeps Scenario References and their count scoped to their owner', () => {
    const parent = workspace.byKey.get('capability:browse-catalog')
    const scenario = workspace.byKey.get('capability-scenario:browse-catalog')
    expect(tabsFor(workspace, parent).at(-1)).toMatchObject({ id: 'references', count: 1 })
    expect(tabsFor(workspace, scenario).at(-1)).toMatchObject({ id: 'references', count: 2 })
    const withoutReferences = { ...scenario, references: [] }
    expect(tabsFor(workspace, withoutReferences).map((tab: any) => tab.id)).toEqual(['overview', 'scenarios', 'connections'])
  })
})
