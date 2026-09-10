import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'

// Renderer utilities use Nuxt's bundler resolution, not root NodeNext imports.
const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const { projectReportWorkspace } = await utility('reportWorkspace')
const projections = await utility('topologyProjections')
const { ruleAttachments } = await utility('topologyTargets')
const { topologyRelations } = await utility('topologyRelations')
const state = await utility('topologyState')
const { PRODUCT_TOPOLOGY_VIEWS } = await utility('productTopologyViews')
const { MAIN_RESOURCE_KINDS, collectionKindFor } = await utility('reportDestinations')
const teachingRoot = join(__dirname, '..', 'blueprints', 'content-feed-reader')
const shopRoot = join(__dirname, 'fixtures', 'fixture-shop')
const reportOf = (root = teachingRoot) => compileReport(loadModel(root), '2026-09-07')
const workspaceOf = (root = teachingRoot) => projectReportWorkspace(reportOf(root))
const flatten = (branches: any[]): any[] => branches.flatMap(item => [item, ...flatten(item.children)])

describe('named topology semantics', () => {
  it('keeps seven questions with explicit diagram types and stable view IDs', () => {
    expect(PRODUCT_TOPOLOGY_VIEWS.map((view: any) => view.id)).toEqual(['product-map', 'value-paths', 'delivery-by-interface', 'sitemap', 'rule-reach', 'what-it-keeps', 'what-changes-what'])
    expect(PRODUCT_TOPOLOGY_VIEWS.every((view: any) => view.question.endsWith('?') && view.diagramType && view.note)).toBe(true)
  })

  /*
    Reachability was the one thing the removed `everything` view guaranteed, and
    the guarantee outlives it: the rail carries it now. Every resource in the
    model files under exactly one of the six collections the rail lists, so a
    reader can arrive at anything without a view that redraws the whole index.
  */
  it.each([teachingRoot, shopRoot, join(__dirname, '..')])('files every resource under one rail collection: %s', root => {
    const workspace = workspaceOf(root)
    const homes = new Set(MAIN_RESOURCE_KINDS)
    for (const resource of workspace.byKey.values()) {
      if (resource.kind === 'product') continue
      expect(homes.has(collectionKindFor(resource.kind)), `${resource.key}`).toBe(true)
    }
    for (const kind of ['experience', 'screen']) expect(collectionKindFor(kind)).toBe('interface')
    expect(collectionKindFor('capability-scenario')).toBe('capability')
    expect(collectionKindFor('journey-scenario')).toBe('journey')
  })

  it('groups by authored Domain and keeps empty Domains and unassigned Capabilities', () => {
    const workspace = workspaceOf()
    workspace.domains.push({ ...workspace.domains[0], id: 'empty', key: 'domain:empty', title: 'Empty' })
    const map = projections.productMapProjection(workspace)
    for (const domain of workspace.domains) {
      const group = map.groups.find((group: any) => group.resource?.key === domain.key)
      expect(group.colorSlot).toBe(domain.colorSlot)
      expect(flatten(group.children).filter((item: any) => item.resource?.kind === 'capability').map((item: any) => item.resource.id)).toEqual(workspace.capabilities.filter((cap: any) => cap.domainId === domain.id).map((cap: any) => cap.id))
    }
    expect(map.groups.find((group: any) => group.id === 'domain:empty').children).toEqual([])
  })

  it('keeps every Entity and Capability classified once, including models without Domains', () => {
    const workspace = workspaceOf()
    const map = projections.productMapProjection(workspace)
    const resources = flatten(map.groups).flatMap(item => item.resource && item.resource.kind !== 'domain' ? [item.resource] : [])
    expect(resources.map(item => item.key).sort()).toEqual([...workspace.capabilities, ...workspace.entities].map(item => item.key).sort())
    const plain = { ...workspace, domains: [], capabilities: workspace.capabilities.map((item: any) => ({ ...item, domainId: undefined })), entities: workspace.entities.map((item: any) => ({ ...item, domainId: undefined })) }
    const groups = projections.productMapProjection(plain).groups
    expect(groups.map((item: any) => item.title)).toEqual(['Unassigned'])
    expect(flatten(groups).filter(item => item.resource).length).toBe(resources.length)
  })

  /*
    Comparing Interfaces is a different question from reading one, and now a
    different shape: a matrix, where a row with two cells is delivered twice and
    a row with one is exclusive. Columns of independent lists staged that
    comparison and left it to the reader's eye. The two readings derive the same
    delivery, so the matrix can never quietly disagree with the Interface page.
  */
  it('compares delivery as a matrix that agrees with each Interface reading', () => {
    for (const root of [teachingRoot, shopRoot]) {
      const workspace = workspaceOf(root)
      const matrix = projections.deliveryMatrixProjection(workspace)

      for (const resource of workspace.interfaces) {
        const inMatrix = new Set(matrix.cells.filter((cell: any) => cell.column === resource.key).map((cell: any) => cell.row))
        const inOutline = new Set(flatten(projections.interfaceProjection(workspace, true).filter((item: any) => item.id === resource.key))
          .flatMap((node: any) => [node.resource, ...node.references])
          .filter((item: any) => item?.kind === 'capability')
          .map((item: any) => item.key))
        expect(inMatrix, resource.key).toEqual(inOutline)
      }

      /* A cell always says how it is delivered, and rows and columns carry only
         what the model actually authors. */
      expect(matrix.cells.every((cell: any) => cell.labels.length > 0)).toBe(true)
      expect(matrix.rows.every((row: any) => matrix.cells.some((cell: any) => cell.row === row.key))).toBe(true)
      expect(matrix.columns.every((column: any) => matrix.cells.some((cell: any) => cell.column === column.key))).toBe(true)
    }
  })

  it('keeps qualified ownership and direct delivery without invented Experiences', () => {
    const workspace = workspaceOf(shopRoot)
    const outline = projections.interfaceProjection(workspace, true)
    for (const item of outline) {
      for (const child of item.children) {
        if (child.resource.kind === 'experience') expect(child.resource.interfaceIds).toContain(item.resource.id)
        if (child.resource.kind === 'capability') {
          expect(item.resource.experienceIds).toEqual([])
          expect(child.resource.contexts.some((context: any) => context.interfaceId === item.resource.id && !context.experienceId)).toBe(true)
        }
      }
    }
    expect(flatten(outline).some(item => item.note === 'Delivered directly')).toBe(true)
    const screens = flatten(projections.interfaceProjection(workspaceOf())).filter(item => item.resource?.kind === 'screen')
    expect(screens.length).toBe(workspaceOf().screens.length)
    expect(new Set(screens.map(item => item.resource.key)).size).toBe(screens.length)
  })

  it('keeps every Capability-bearing Step in order, with its exact route Contexts', () => {
    const workspace = workspaceOf()
    for (const journey of workspace.journeys) {
      const composition = projections.compositionProjection(workspace, journey.id)
      expect(composition.journey.id).toBe(journey.id)
      for (const column of composition.scenarios) {
        const expected = column.resource.steps.map((step: any, index: number) => ({ step, index })).filter((item: any) => item.step.capabilityId)
        expect(column.steps.map((step: any) => step.number)).toEqual(expected.map((item: any) => item.index + 1))
        for (const [index, occurrence] of column.steps.entries()) {
          expect(occurrence.id).toBe(`${column.resource.key}:step:${expected[index].index}`)
          expect(occurrence.contexts.map((context: any) => [context.routeId, context.context.id])).toEqual(expected[index].step.contexts.map((context: any) => [context.routeId, context.context.id]))
        }
      }
    }
    const composition = projections.compositionProjection(workspace)
    const occurrences = composition.scenarios.flatMap((scenario: any) => scenario.steps)
    expect(new Set(occurrences.map((item: any) => item.id)).size).toBe(occurrences.length)
    expect(new Set(occurrences.map((item: any) => item.resource.key)).size).toBeLessThan(occurrences.length)
    expect(composition.scenarios.some((scenario: any) => scenario.resource.result === 'not-achieved')).toBe(true)
  })

  it('preserves all direct typed Rule selectors, including scoped Entity and Context targets', () => {
    const report = reportOf(shopRoot)
    const template = report.model.businessRules[0]!
    const placeId = report.model.screens[0]!.id
    report.model.businessRules.push({ ...template, id: 'all-targets', title: 'All targets', appliesTo: [
      { type: 'entity', entityId: 'order', effect: 'changes', from: 'Pending', to: 'Confirmed', facts: ['Total charged'], contexts: [{ placeId }] },
      { type: 'context', context: { placeId } },
      { type: 'capability', id: report.model.capabilities[0]!.id, contexts: [] },
      { type: 'capability-scenario', id: report.model.capabilityScenarios[0]!.id, contexts: [{ placeId }] },
      { type: 'journey', id: report.model.journeys[0]!.id, contexts: [] },
      { type: 'journey-scenario', id: report.model.journeyScenarios[0]!.id, contexts: [] }
    ] })
    const workspace = projectReportWorkspace(report)
    const rule = workspace.rules.find((item: any) => item.id === 'all-targets')
    const attachments = ruleAttachments(workspace, rule)
    expect(attachments).toHaveLength(6)
    expect(attachments.map((item: any) => item.target)).toEqual(rule.appliesTo)
    expect(attachments[0].details).toEqual(['from Pending', 'to Confirmed', 'fact: Total charged'])
    expect(attachments[0].contexts[0].id).toBe(placeId)
    const matrix = projections.ruleReachProjection(workspace)
    expect(matrix.cells.filter((cell: any) => cell.row === rule.key).flatMap((cell: any) => cell.attachments)).toHaveLength(6)
    expect(matrix.columns.some((column: any) => column.kind === 'domain')).toBe(false)
  })

  it('aggregates mutations with evidence, without converting reads into changes', () => {
    const workspace = workspaceOf(shopRoot)
    const matrix = projections.mutationProjection(workspace)
    for (const capability of workspace.capabilities) {
      const cells = matrix.cells.filter((cell: any) => cell.row === capability.key)
      expect(cells).toHaveLength(capability.entityEffects.length)
      for (const cell of cells) {
        const effect = capability.entityEffects.find((line: any) => `entity:${line.entityId}` === cell.column)
        expect(cell.labels).toEqual([...new Set(effect.effects.map((item: any) => item.effect))])
        expect(cell.labels).not.toContain('reads')
        expect(cell.evidence.map((item: any) => item.id)).toEqual(effect.scenarioIds)
      }
    }
  })

  it('draws each authored Entity relation exactly once, including parallel and self relations', () => {
    const workspace = workspaceOf()
    const entity = workspace.entities[0]
    entity.relations.push({ entityId: entity.id, verb: 'groups', ends: 'many-to-many', cardinality: 'many' })
    entity.relations.push({ ...entity.relations[0], verb: 'also groups' })
    const diagram = projections.entityRelationsProjection(workspace)
    expect(diagram.nodes.map((node: any) => node.id)).toEqual(workspace.entities.map((item: any) => item.key))
    expect(diagram.edges).toHaveLength(workspace.entities.reduce((sum: number, item: any) => sum + item.relations.length, 0))
    expect(new Set(diagram.edges.map((edge: any) => edge.id)).size).toBe(diagram.edges.length)
    expect(diagram.edges.some((edge: any) => edge.source === edge.target)).toBe(true)
    expect(diagram.edges.some((edge: any) => edge.label === 'groups M:N')).toBe(true)
  })

  it('filters before arrangement and retains structural ancestors', () => {
    const workspace = workspaceOf()
    const base = projections.interfaceProjection(workspace)
    const screen = workspace.screens[0]
    const filtered = projections.filterBranches(base, (resource: any) => resource.key === screen.key)
    const resources = flatten(filtered).map(item => item.resource)
    expect(resources.some(item => item.key === screen.key)).toBe(true)
    expect(resources.filter(item => item.kind === 'screen')).toHaveLength(1)
    expect(resources.some(item => item.kind === 'interface')).toBe(true)
    expect(flatten(base).length).toBeGreaterThan(resources.length)
  })

  it('keeps neighbourhood relation endpoints resolvable and direction intact', () => {
    const workspace = workspaceOf(shopRoot)
    const relations = topologyRelations(workspace)
    expect(relations.every((relation: any) => workspace.byKey.has(relation.source) && workspace.byKey.has(relation.target))).toBe(true)
    expect(relations.some((relation: any) => relation.source.startsWith('rule:') && relation.target.startsWith('entity:'))).toBe(true)
  })
})

describe('topology reading state', () => {
  it('round trips qualified IDs as repeated query values without delimiter ambiguity', () => {
    const reading = { ...state.defaultTopologyReading(), view: 'sitemap', focus: ['screen:a::b::c', 'entity:a,b'], expanded: ['kind:entity'], collapsed: ['kind:rule'] }
    expect(state.topologyFromQuery(state.topologyToQuery(reading))).toEqual(reading)
    expect(Object.values(state.topologyToQuery(state.defaultTopologyReading())).every(value => value === undefined)).toBe(true)
    expect(state.topologyFromQuery({ tv: 'made-up', th: ['not-a-kind'] })).toEqual(state.defaultTopologyReading())
  })
  it('preserves surviving resources after an edit and clears removed selections', () => {
    const workspace = workspaceOf()
    const reading = { ...state.defaultTopologyReading(), focus: [workspace.entities[0].key, 'entity:removed'], journey: 'removed', scenario: 'removed', column: 'removed', expanded: ['kind:entity', 'domain:removed'], collapsed: ['kind:entity', 'invalid'] }
    const next = state.sanitizeTopologyReading(reading, workspace)
    expect(next.focus).toEqual([workspace.entities[0].key])
    expect(next.journey).toBe(null)
    expect(next.scenario).toBe(null)
    expect(next.column).toBe(null)
    expect(next.expanded).toEqual(['kind:entity'])
    expect(next.collapsed).toEqual([])
  })
  it('keeps explicit expansion choices as group sizes change', () => {
    const reading = state.defaultTopologyReading()
    expect(state.topologyGroupOpen(reading, 'a', 8)).toBe(true)
    expect(state.topologyGroupOpen(reading, 'a', 9)).toBe(false)
    const expanded = state.toggleTopologyGroup(reading, 'a', true)
    expect(state.topologyGroupOpen(expanded, 'a', 500)).toBe(true)
    expect(state.topologyGroupOpen(state.toggleTopologyGroup(expanded, 'a', false), 'a', 1)).toBe(false)
  })
  it('pushes navigation and replaces filter/group-only changes', () => {
    const before = state.defaultTopologyReading()
    expect(state.topologyPushesHistory(before, { ...before, view: 'sitemap' })).toBe(true)
    expect(state.topologyPushesHistory(before, { ...before, focus: ['entity:order'] })).toBe(true)
    expect(state.topologyPushesHistory(before, { ...before, hiddenKinds: ['entity'] })).toBe(false)
    expect(state.topologyPushesHistory(before, { ...before, expanded: ['kind:entity'] })).toBe(false)
    expect(state.topologyPushesHistory({ ...before, focus: ['entity:removed'], journey: 'removed', scenario: 'removed', column: 'removed' }, before)).toBe(false)
  })
})
