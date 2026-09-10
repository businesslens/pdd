import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const { projectReportWorkspace } = await utility('reportWorkspace')
const { REPORT_DESTINATIONS, MAIN_RESOURCE_KINDS, resourceAncestors, destinationForLocation, collectionKindFor, resourceViewLinks } = await utility('reportDestinations')
const { findProductTopologyView } = await utility('productTopologyViews')
const { resourceConnectionRows } = await utility('resourceConnections')
const { interfaceProjection } = await utility('topologyProjections')
const workspace = projectReportWorkspace(compileReport(loadModel(join(__dirname, '../test/fixtures/fixture-shop')), '2026-09-08'))

describe('report destinations', () => {
  it('gives each named view one collection home, reachable as a tab of it', () => {
    expect(MAIN_RESOURCE_KINDS).toEqual(['entity', 'interface', 'domain', 'capability', 'journey', 'rule'])
    /* Every named view belongs to a resource collection. The Overview owns none:
       "what is in the Product, and how is it connected" is answered by the rail,
       which lists every collection with its count, and by each resource's own
       Connections — a view redrawing the whole index answered nobody. */
    const homes = new Set<string>(MAIN_RESOURCE_KINDS)
    expect(REPORT_DESTINATIONS.some((item: any) => item.rail === 'overview')).toBe(false)
    for (const item of REPORT_DESTINATIONS) {
      /* The rail changes the subject and a tab changes the set, so every named
         view belongs to exactly one collection and is reached from inside it. */
      expect(homes.has(item.rail), `${item.section} has no collection`).toBe(true)
      expect(destinationForLocation(item.rail, item.mode)?.section).toBe(item.section)
      /* Its question is the tab's hint, so the view never titles itself. */
      expect(findProductTopologyView(item.view).question).toBeTruthy()
    }
    /* One tab per mode within a collection, or two tabs would answer to one URL. */
    for (const rail of homes) {
      const modes = REPORT_DESTINATIONS.filter((item: any) => item.rail === rail).map((item: any) => item.mode)
      expect(new Set(modes).size, rail).toBe(modes.length)
      expect(modes).not.toContain('overview')
    }
  })

  it('leaves an address it cannot place on the Overview rather than guessing', () => {
    /* Every standalone view URL changed shape with the restructure. A shim that
       silently lands a reader somewhere else is worse than a clean landing. */
    expect(destinationForLocation('topology', 'overview')).toBeUndefined()
    expect(destinationForLocation('what-changes-what', 'overview')).toBeUndefined()
    expect(destinationForLocation('capability', 'mutations', 'capability:checkout')).toBeUndefined()
  })

  it('keeps child pages in Interfaces and derives actual ownership', () => {
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
    expect(sections(workspace.interfaces[0])).toContain('interface-map')
    expect(sections(workspace.domains[0])).toContain('product-map')
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
      expect(resourceConnectionRows(workspace, resource).map((row: any) => row.label)).not.toContain('Screens available')
    }
  })
})
