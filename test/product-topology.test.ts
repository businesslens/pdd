import { join } from 'node:path'
import { shallowRef } from 'vue'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'

// Renderer utilities use Nuxt's bundler resolution, not root NodeNext imports.
const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const matrixViewModule = '../layers/nuxt/report-viewer/app/composables/useBlrMatrixView.ts'
const { useBlrMatrixView } = await import(matrixViewModule)
const { projectReportWorkspace } = await utility('reportWorkspace')
const projections = await utility('topologyProjections')
const { ruleAttachments } = await utility('topologyTargets')
const { relationshipBadges } = await utility('matrixBadges')
const { collectionRelation, collectionRelationDrawing, filterCollectionRelation, pruneRelationSelections } = await utility('collectionRelations')
const { filterResources, facetKindsFor } = await utility('resourceFacets')
const { resourceCardPresentation } = await utility('resourceCards')
const { topologyRelations } = await utility('topologyRelations')
const state = await utility('topologyState')
const { PRODUCT_TOPOLOGY_VIEWS } = await utility('productTopologyViews')
const { MAIN_RESOURCE_KINDS, collectionKindFor } = await utility('reportDestinations')
const { uiMapDiagram, uiMapGroupIds, UI_MAP_ENTRY } = await utility('uiMap')
const { topologyNeighbourhood } = await utility('topologyFocus')
const teachingRoot = join(__dirname, '..', 'blueprints', 'content-feed-reader')
const shopRoot = join(__dirname, 'fixtures', 'fixture-shop')
const reportOf = (root = teachingRoot) => compileReport(loadModel(root), '2026-09-07')
const workspaceOf = (root = teachingRoot) => projectReportWorkspace(reportOf(root))
const flatten = (branches: any[]): any[] => branches.flatMap(item => [item, ...flatten(item.children)])

describe('named topology semantics', () => {
  it('keeps projections stable across selection changes and refreshes them with the report', () => {
    const workspace = shallowRef(workspaceOf(shopRoot))
    const kind = shallowRef('entity')
    const selections = shallowRef<string[]>([])
    const view = useBlrMatrixView(workspace, kind, selections)
    const original = view.value
    expect(original.mode).toBe('mutations')
    selections.value = [original.source.columns[0].key]
    expect(view.value.source).toBe(original.source)
    kind.value = 'capability'
    expect(view.value.mode).toBe('delivery')
    selections.value = []
    const previous = view.value.source
    workspace.value = workspaceOf(teachingRoot)
    expect(view.value.source).not.toBe(previous)
    expect(view.value.matrix.rows.length).toBeGreaterThan(0)
  })

  it.each(['entity', 'capability', 'rule'])('uses the same %s relation for matching subjects, columns and row explanations', kind => {
    const workspace = workspaceOf(shopRoot)
    const relation = collectionRelation(workspace, kind)
    const { source } = relation
    expect(filterCollectionRelation(source, [])).toEqual(source)
    const target = source.columns.find((column: any) => source.cells.some((cell: any) => cell.column === column.key))
    const filtered = filterCollectionRelation(source, [target.key])
    const expected = new Set(source.cells.filter((cell: any) => cell.column === target.key).map((cell: any) => cell.row))
    expect(filtered.rows.map((row: any) => row.key)).toEqual(source.rows.filter((row: any) => expected.has(row.key)).map((row: any) => row.key))
    expect(filtered.columns).toEqual([target])
    for (const row of filtered.rows) expect(resourceCardPresentation(workspace, row).hookLabel).toBe(relation.label)
    // AND with a primary selection or other collection facet, including zero results.
    expect(filterCollectionRelation(source, [target.key], []).rows).toEqual([])
    const domain = workspace.domains[0]
    const domainRows = filterResources(source.rows, { domain: [domain.id] })
    expect(filterCollectionRelation(source, [target.key], domainRows).rows)
      .toEqual(filtered.rows.filter((row: any) => domainRows.includes(row)))
    expect(filterCollectionRelation(source, ['missing:resource']).rows).toEqual([])
    expect(facetKindsFor(workspace, kind)).not.toContain(kind === 'entity' ? 'capability' : 'interface')
  })

  it('offers one Capability availability axis and removes separate Screen and Scenario facets', () => {
    const workspace = workspaceOf(shopRoot)
    const relation = collectionRelation(workspace, 'capability')
    expect([...new Set(relation.source.columns.map((resource: any) => resource.kind))]).toEqual(['interface', 'experience', 'screen'])
    expect(facetKindsFor(workspace, 'capability')).toEqual(['domain', 'entity'])
    expect(collectionRelationDrawing(relation, [])).toEqual(projections.deliveryMatrixProjection(workspace))
  })

  it('filters Screen availability exactly while comparing only its containing Interfaces and routes', () => {
    const workspace = workspaceOf(shopRoot)
    const relation = collectionRelation(workspace, 'capability')
    for (const screen of workspace.screens) {
      const matrix = collectionRelationDrawing(relation, [screen.key])
      expect(matrix.rows).toEqual(workspace.capabilities.filter((capability: any) => screen.capabilityIds.includes(capability.id)))
      expect(matrix.columns).toEqual(workspace.interfaces.filter((iface: any) => screen.interfaceIds.includes(iface.id)))
      for (const cell of matrix.cells) {
        expect(cell.evidence).toEqual([screen])
        expect(cell.labels).toEqual(['on screen'])
      }
    }
  })

  it('includes an Experience’s Screens, unions location types, and never expands parent delivery to every child', () => {
    const workspace = workspaceOf(shopRoot)
    const relation = collectionRelation(workspace, 'capability')
    for (const experience of workspace.experiences) {
      const screens = workspace.screens.filter((screen: any) => screen.experienceIds.includes(experience.id))
      const expected = workspace.capabilities.filter((capability: any) =>
        capability.contexts.some((context: any) => context.experienceId === experience.id)
        || screens.some((screen: any) => screen.capabilityIds.includes(capability.id)))
      const matrix = collectionRelationDrawing(relation, [experience.key])
      expect(matrix.rows).toEqual(expected)
      expect(matrix.columns).toEqual(workspace.interfaces.filter((iface: any) => experience.interfaceIds.includes(iface.id)))
      expect(matrix.cells.every((cell: any) => cell.evidence.every((item: any) => item.key === experience.key || screens.includes(item)))).toBe(true)
    }
    const selections = ['type:screen', workspace.interfaces[0].key]
    const screenRows = collectionRelationDrawing(relation, ['type:screen']).rows
    const interfaceRows = collectionRelationDrawing(relation, [workspace.interfaces[0].key]).rows
    expect(collectionRelationDrawing(relation, selections).rows).toEqual(workspace.capabilities.filter((capability: any) => screenRows.includes(capability) || interfaceRows.includes(capability)))
    for (const kind of ['interface', 'experience', 'screen']) {
      const individual = relation.source.columns.filter((item: any) => item.kind === kind).map((item: any) => item.key)
      expect(collectionRelationDrawing(relation, [`type:${kind}`])).toEqual(collectionRelationDrawing(relation, individual))
    }
    const empty = collectionRelationDrawing(relation, ['screen:missing'])
    expect(empty.rows).toEqual([])
    expect(empty.cells).toEqual([])
  })

  it('unions exact Rule targets and whole types, without treating attachment restrictions as targets', () => {
    const workspace = workspaceOf()
    const { source } = collectionRelation(workspace, 'rule')
    const other = source.columns.find((resource: any) => resource.kind !== 'entity')
    const selected = ['type:entity', other.key]
    const matrix = filterCollectionRelation(source, selected)
    expect(matrix.columns).toEqual(source.columns.filter((resource: any) => resource.kind === 'entity' || resource.key === other.key))
    const expected = workspace.rules.filter((rule: any) => ruleAttachments(workspace, rule)
      .some((attachment: any) => attachment.resource.kind === 'entity' || attachment.resource.key === other.key))
    expect(matrix.rows).toEqual(expected)
    for (const target of source.columns) {
      expect(filterCollectionRelation(source, [target.key]).rows).toEqual(workspace.rules.filter((rule: any) =>
        ruleAttachments(workspace, rule).some((attachment: any) => attachment.resource.key === target.key)))
    }
    const updated = { ...source, columns: source.columns.filter((resource: any) => resource.kind !== 'entity') }
    expect(pruneRelationSelections(updated, [...selected, 'missing:key', other.key])).toEqual([other.key])
    expect(filterCollectionRelation(source, []).rows).toEqual(workspace.rules)
  })

  it('retains subjects without relationships even when there are no comparison columns', () => {
    const workspace = workspaceOf(shopRoot)
    const sparse = { ...workspace, capabilities: [], interfaces: [], rules: workspace.rules.map((rule: any) => ({ ...rule, appliesTo: [] })) }
    const entities = projections.mutationProjection(sparse)
    expect(entities.rows).toEqual(workspace.entities)
    expect(entities.columns).toEqual([])
    expect(entities.cells).toEqual([])
    const delivery = projections.deliveryMatrixProjection({ ...workspace, interfaces: [] })
    expect(delivery.rows).toEqual(workspace.capabilities)
    expect(delivery.columns).toEqual([])
    expect(delivery.cells).toEqual([])
  })

  it('keeps ten questions with explicit diagram types and stable view IDs', () => {
    expect(PRODUCT_TOPOLOGY_VIEWS.map((view: any) => view.id)).toEqual(['domain-reach', 'capability-reach', 'journey-reach', 'rule-reach', 'delivery-map', 'ui-map', 'what-it-keeps', 'delivery-by-interface', 'rule-attachments', 'what-changes-what'])
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

  /*
    A reach tree draws one collection's set rooted at the Product. Every subject
    is a first-tier node under its own key; everything below is an occurrence
    whose id is the path of keys, so a place two Capabilities share is two nodes
    that open the same page.
  */
  it.each(['domain', 'capability', 'journey', 'rule'])('roots the %s reach tree at the Product with every subject once and occurrences below', (kind) => {
    const workspace = workspaceOf(shopRoot)
    const tree = projections.reachTreeProjection(workspace, kind)
    expect(tree.id).toBe(`product:${workspace.identity.id}`)
    const subjects = tree.children.filter((item: any) => item.resource)
    const all = { domain: workspace.domains, capability: workspace.capabilities, journey: workspace.journeys, rule: workspace.rules }[kind]
    expect(subjects.map((item: any) => item.id)).toEqual(all.map((item: any) => item.key))
    const ids = new Set<string>()
    for (const node of flatten(tree.children)) {
      expect(ids.has(node.id), node.id).toBe(false)
      ids.add(node.id)
      if (node.resource) expect(workspace.byKey.get(node.resource.key)).toBe(node.resource)
      const segments = node.id.split(projections.OCCURRENCE_SEPARATOR)
      for (const segment of segments) expect(workspace.byKey.has(segment) || segment === 'unassigned', segment).toBe(true)
      if (node.resource && segments.length > 1) expect(segments.at(-1)).toBe(node.resource.key)
    }
    /* Only a subject with a Context or an attachment branches. */
    for (const subject of subjects) {
      const resource = subject.resource
      const reach = kind === 'rule' ? [...resource.appliesTo, ...resource.contexts] : kind === 'domain' ? [...resource.capabilityIds, ...resource.journeyIds, ...resource.ruleIds] : [...resource.contexts, ...resource.ruleIds]
      expect(subject.children.length > 0, subject.id).toBe(reach.length > 0)
    }
  })

  it('draws a place once under each Rule, even when it is both a direct target and a reached Context', () => {
    const report = reportOf(shopRoot)
    const first = report.model.interfaces[0]!.id
    const second = report.model.interfaces[1]!.id
    const entity = report.model.entities[0]!.id
    const template = report.model.businessRules[0]!
    report.model.businessRules.push(
      { ...template, id: 'direct-places', appliesTo: [
        { type: 'context', context: { placeId: first } },
        { type: 'context', context: { placeId: second } }
      ] },
      { ...template, id: 'mixed-places', appliesTo: [
        { type: 'context', context: { placeId: first } },
        { type: 'entity', entityId: entity, effect: null, from: null, to: null, facts: [], contexts: [{ placeId: first }, { placeId: second }] }
      ] }
    )
    const tree = projections.reachTreeProjection(projectReportWorkspace(report), 'rule')
    const direct = tree.children.find((node: any) => node.id === 'rule:direct-places')
    const mixed = tree.children.find((node: any) => node.id === 'rule:mixed-places')
    expect(direct.children.map((node: any) => node.resource.key)).toEqual([`interface:${first}`, `interface:${second}`])
    expect(mixed.children.map((node: any) => node.resource.key)).toEqual([`interface:${first}`, `entity:${entity}`, `interface:${second}`])
    // Sharing a place across different Rules still gives each Rule its own occurrence.
    const ids = flatten(tree.children).map(node => node.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('reaches a Domain through the places its members are available in, and keeps the rest directly under it', () => {
    const workspace = workspaceOf()
    const tree = projections.reachTreeProjection(workspace, 'domain')
    for (const branch of tree.children) {
      const members = new Map(flatten(branch.children).filter((node: any) => node.resource && !['interface', 'experience', 'screen'].includes(node.resource.kind)).map((node: any) => [node.resource.key, node]))
      const expected = branch.resource
        ? [...branch.resource.capabilityIds.map((id: string) => `capability:${id}`), ...branch.resource.journeyIds.map((id: string) => `journey:${id}`), ...branch.resource.ruleIds.map((id: string) => `rule:${id}`)]
        : [...workspace.capabilities.filter((item: any) => !item.domainId), ...workspace.journeys.filter((item: any) => !item.domainIds.length), ...workspace.rules.filter((item: any) => !item.domainIds.length)].map((item: any) => item.key)
      expect([...members.keys()].sort()).toEqual([...new Set(expected)].sort())
      for (const place of branch.children.filter((node: any) => ['interface', 'experience', 'screen'].includes(node.resource?.kind))) {
        for (const member of place.children) expect(projections.placesOf(workspace, member.resource.contexts).map((item: any) => item.key)).toContain(place.resource.key)
      }
      for (const direct of branch.children.filter((node: any) => node.resource && !['interface', 'experience', 'screen'].includes(node.resource.kind))) {
        expect(projections.placesOf(workspace, direct.resource.contexts)).toEqual([])
      }
    }
    const plain = { ...workspace, domains: [], capabilities: workspace.capabilities.map((item: any) => ({ ...item, domainId: undefined })), journeys: workspace.journeys.map((item: any) => ({ ...item, domainIds: [] })), rules: workspace.rules.map((item: any) => ({ ...item, domainIds: [] })) }
    expect(projections.reachTreeProjection(plain, 'domain').children.map((item: any) => item.title)).toEqual(['Unassigned'])
  })

  it('resolves a place to the most specific resource a Context names, each once', () => {
    const workspace = workspaceOf()
    for (const capability of workspace.capabilities) {
      const places = projections.placesOf(workspace, capability.contexts)
      expect(new Set(places.map((item: any) => item.key)).size).toBe(places.length)
      for (const [index, context] of capability.contexts.entries()) {
        const expected = context.screenId ? `screen:${context.screenId}` : context.experienceId ? `experience:${context.experienceId}` : `interface:${context.interfaceId}`
        if (workspace.byKey.has(expected)) expect(places.map((item: any) => item.key), `${capability.id} context ${index}`).toContain(expected)
      }
    }
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

  it('keeps delivery popovers tied to their own route kind within a mixed cell', () => {
    const workspace = workspaceOf(shopRoot)
    const screen = workspace.screens[0]
    const experience = workspace.experiences[0]
    const cell = { id: 'mixed', row: workspace.capabilities[0].key, column: workspace.interfaces[0].key,
      labels: ['in experience', 'on screen'], evidence: [experience, screen], details: [] }
    const badges = relationshipBadges(cell, 'delivery')
    expect(badges.map((badge: any) => [badge.label, badge.routes.map((route: any) => route.key)])).toEqual([
      ['in experience', [experience.key]], ['on screen', [screen.key]]
    ])
    const direct = relationshipBadges({ ...cell, labels: ['direct', 'in experience'], evidence: [experience] }, 'delivery')
    expect(direct[0].routes).toEqual([])
    expect(direct[1].routes).toEqual([experience])
  })

  it('keeps each attachment badge tied to all of its own selectors and scopes', () => {
    const report = reportOf(shopRoot)
    const placeId = report.model.screens[0]!.id
    const entity = { type: 'entity' as const, entityId: 'order', effect: 'changes' as const, from: null, to: null, facts: [], contexts: [] }
    report.model.businessRules.push({ ...report.model.businessRules[0]!, id: 'badge-scopes', appliesTo: [
      { ...entity, from: 'Pending', to: 'Confirmed', contexts: [{ placeId }] },
      { ...entity, to: 'Cancelled' },
      { ...entity, effect: 'creates', to: 'Pending' },
      { ...entity, effect: null, facts: ['Total charged'] }
    ] })
    const workspace = projectReportWorkspace(report)
    const cell = projections.ruleAttachmentsProjection(workspace).cells.find((cell: any) => cell.row === 'rule:badge-scopes')
    const badges = relationshipBadges(cell, 'rules')
    expect(badges.map((badge: any) => badge.label)).toEqual(['changes', 'creates', 'attached'])
    expect(badges[0].attachments.map((attachment: any) => attachment.target.to)).toEqual(['Confirmed', 'Cancelled'])
    expect(badges[0].attachments[0].contexts.map((context: any) => context.id)).toEqual([placeId])
    expect(badges[0].attachments[1].contexts).toEqual([])
    expect(badges[1].attachments.map((attachment: any) => attachment.target.to)).toEqual(['Pending'])
    expect(badges[2].attachments[0].target.facts).toEqual(['Total charged'])
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
    const matrix = projections.ruleAttachmentsProjection(workspace)
    expect(matrix.cells.filter((cell: any) => cell.row === rule.key).flatMap((cell: any) => cell.attachments)).toHaveLength(6)
    expect(matrix.columns.some((column: any) => column.kind === 'domain')).toBe(false)
  })

  it('compares Entities by Capability, retaining mutation evidence and excluding reads', () => {
    const workspace = workspaceOf(shopRoot)
    const matrix = projections.mutationProjection(workspace)
    expect(matrix.rows.length).toBeGreaterThan(0)
    expect(matrix.columns.length).toBeGreaterThan(0)
    expect(matrix.rows.every((row: any) => row.kind === 'entity')).toBe(true)
    expect(matrix.columns.every((column: any) => column.kind === 'capability')).toBe(true)
    for (const capability of workspace.capabilities) {
      const cells = matrix.cells.filter((cell: any) => cell.column === capability.key)
      expect(cells).toHaveLength(capability.entityEffects.length)
      for (const cell of cells) {
        const effect = capability.entityEffects.find((line: any) => `entity:${line.entityId}` === cell.row)
        expect(cell.labels).toEqual([...new Set(effect.effects.map((item: any) => item.effect))])
        expect(cell.labels).not.toContain('reads')
        expect(cell.evidence.map((item: any) => item.id)).toEqual(effect.scenarioIds)
      }
    }
  })

  it('keeps each mutation badge tied to its own Scenarios and authored states', () => {
    const matrix = projections.mutationProjection(workspaceOf(join(__dirname, '..')))
    const mutations = (entity: string, capability: string) => matrix.cells.find((cell: any) =>
      cell.row === `entity:${entity}` && cell.column === `capability:${capability}`).mutations
    const evidenceIds = (mutation: any) => mutation.variants.flatMap((variant: any) => variant.evidence.map((scenario: any) => scenario.id)).sort()
    const decision = mutations('product-model', 'decide-intended-behavior')
    expect(evidenceIds(decision.find((item: any) => item.effect === 'creates'))).toEqual(['decide-a-new-product'])
    expect(evidenceIds(decision.find((item: any) => item.effect === 'changes'))).toEqual(['change-behavior-and-verify-the-branch', 'write-an-approved-model-delta'])

    const exported = mutations('blueprint', 'export-blueprint')[0]
    expect(exported.effect).toBe('creates')
    expect(exported.variants).toHaveLength(1)
    expect(exported.variants[0]).toMatchObject({ from: '', to: 'Exported' })
    expect(evidenceIds(exported)).toEqual(['export-a-portable-blueprint', 'export-here-and-open-there'])

    const contributed = mutations('blueprint', 'contribute-blueprint')
    expect(contributed.map((item: any) => item.effect)).toEqual(['creates', 'changes'])
    expect(contributed[1].variants[0]).toMatchObject({ from: 'Exported', to: 'Proposed' })
    // The same Scenario can support both badges when its Steps do both things.
    for (const mutation of contributed) expect(evidenceIds(mutation)).toEqual(['open-a-blueprint-pull-request'])
  })

  it('separates state variants and deduplicates repeated Steps without borrowing evidence from another Capability', () => {
    const workspace = workspaceOf(join(__dirname, '..'))
    const source = workspace.scenarios.find((scenario: any) => scenario.id === 'export-here-and-open-there')
    const step = (capabilityId: string, effect: string, to: string) => ({ ...source.steps[0], capabilityId,
      entities: [{ entityId: 'blueprint', as: '', effect, from: '', to }] })
    // Shared ids across Scenario kinds must not merge their distinct evidence.
    workspace.scenarios = [
      { ...source, id: 'shared', key: 'journey-scenario:shared', steps: [
        step('export-blueprint', 'creates', 'Exported'), step('export-blueprint', 'creates', 'Exported'),
        step('contribute-blueprint', 'creates', 'Proposed')
      ] },
      { ...source, id: 'shared', key: 'capability-scenario:shared', scenarioType: 'capability', capabilityId: 'export-blueprint',
        steps: [step('', 'creates', 'Proposed')] },
      { ...source, key: 'journey-scenario:read-only', steps: [step('export-blueprint', 'reads', '')] }
    ]
    const capability = workspace.capabilities.find((item: any) => item.id === 'export-blueprint')
    capability.entityEffects.find((item: any) => item.entityId === 'blueprint').effects.push({ effect: 'creates', from: '', to: 'Proposed', scenarioIds: ['shared'] })
    const cell = projections.mutationProjection(workspace).cells.find((item: any) => item.id === 'entity:blueprint->capability:export-blueprint')
    const variants = cell.mutations[0].variants
    expect(variants.map((item: any) => item.to)).toEqual(['Exported', 'Proposed'])
    expect(variants[0].evidence.map((item: any) => item.key)).toEqual(['journey-scenario:shared'])
    expect(variants[1].evidence.map((item: any) => item.key)).toEqual(['capability-scenario:shared'])
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

/*
  The UI map is derived (plan D6): frames are containment, arrows are place
  changes between consecutive placed Steps of one Scenario route, labelled with
  the Capability of the Step that arrives, plus entry points from outside.
  `navigation` marks a node and never draws an arrow, so an unwalked place is
  an island — a visible absence, not a drawing defect.
*/
describe('derived UI map', () => {
  const workspace = workspaceOf(shopRoot)
  const map = projections.uiMapProjection(workspace)
  const move = (from: string, to: string, capabilityId: string) => map.moves.find((item: any) => item.from.key === from && item.to.key === to && item.capabilityId === capabilityId)
  const WEB_CATALOG = 'screen:customer-web::catalog'
  const WEB_PRODUCT = 'screen:customer-web::storefront::product-record'
  const WEBHOOK = 'interface:payment-webhook'
  const ADMIN_ORDER = 'screen:admin-web::order-detail'

  it('draws every place as the containment tree, nested, with a Screenless Interface as one node', () => {
    expect(map.places).toEqual(projections.interfaceProjection(workspace))
    const diagram = uiMapDiagram(map.places, map, state.defaultTopologyReading())
    const keys = [...workspace.byKey.values()].filter((item: any) => ['interface', 'experience', 'screen'].includes(item.kind)).map((item: any) => item.key)
    expect(diagram.nodes.filter((node: any) => node.id !== UI_MAP_ENTRY).map((node: any) => node.id).sort()).toEqual([...keys].sort())
    for (const screen of workspace.screens) {
      const node = diagram.nodes.find((item: any) => item.id === screen.key)
      expect(node.parent).toBe(screen.parentScreenId ? `screen:${screen.parentScreenId}` : screen.contexts[0].experienceId ? `experience:${screen.contexts[0].experienceId}` : `interface:${screen.contexts[0].interfaceId}`)
      expect(node.navigation).toBe(screen.alwaysReachable || undefined)
    }
    for (const node of diagram.nodes.filter((item: any) => item.id !== UI_MAP_ENTRY)) {
      expect(node.group, node.id).toBe(diagram.nodes.some((item: any) => item.parent === node.id) || undefined)
    }
    expect(diagram.nodes.find((node: any) => node.id === 'interface:operator-cli')).toMatchObject({ group: undefined, parent: undefined })
    expect(uiMapGroupIds(map.places).sort()).toEqual(diagram.nodes.filter((node: any) => node.group).map((node: any) => node.id).sort())
  })

  it('moves where a Scenario route changes place, labelled with the arriving Step\'s Capability, and never where it stays', () => {
    const browse = move(WEB_CATALOG, WEB_PRODUCT, 'browse-catalog')
    expect(browse.scenarios.map((item: any) => item.key)).toContain('capability-scenario:browse-catalog')
    expect(browse.capability.title).toBe('Catalog browsing')
    // The Journey's third Step arrives at the webhook by settling payment.
    const settle = move(WEB_PRODUCT, WEBHOOK, 'settle-payment')
    expect(settle.scenarios.map((item: any) => item.id)).toContain('cancel-an-order-before-fulfilment')
    expect(move(WEB_PRODUCT, WEBHOOK, 'place-order')).toBeUndefined()
    // A condition Step with no Context is skipped, not a change: the walk continues to the admin Screen.
    expect(move(WEBHOOK, ADMIN_ORDER, 'cancel-order').scenarios.map((item: any) => item.id)).toContain('cancel-an-order-before-fulfilment')
    // The mobile route of the same Scenario stays on one Screen, so it draws nothing.
    expect(map.moves.filter((item: any) => item.scenarios.some((scenario: any) => scenario.key === 'capability-scenario:browse-catalog'))).toEqual([browse])
    expect(map.moves.some((item: any) => item.from.key === item.to.key)).toBe(false)
    // One move per (from, to, Capability), naming every Scenario that walks it.
    expect(new Set(map.moves.map((item: any) => item.id)).size).toBe(map.moves.length)
    expect(settle.scenarios.length).toBeGreaterThan(1)
    for (const item of map.moves) expect(new Set(item.scenarios).size).toBe(item.scenarios.length)
  })

  it('draws moves as arrows that open the Capability and read their Scenarios, and entry points from outside', () => {
    const diagram = uiMapDiagram(map.places, map, state.defaultTopologyReading())
    const arrow = diagram.edges.find((edge: any) => edge.source === WEB_CATALOG && edge.target === WEB_PRODUCT)
    expect(arrow).toMatchObject({ label: 'Catalog browsing', resourceKey: 'capability:browse-catalog' })
    expect(arrow.note).toContain('Browse the catalog')
    expect(diagram.edges.filter((edge: any) => edge.source !== UI_MAP_ENTRY)).toHaveLength(map.moves.length)
    const entry = diagram.nodes.find((node: any) => node.id === UI_MAP_ENTRY)
    expect(entry).toMatchObject({ terminal: 'start', title: 'Entry' })
    expect(diagram.nodes[0]).toBe(entry)
    const entered = diagram.edges.filter((edge: any) => edge.source === UI_MAP_ENTRY)
    expect(entered.map((edge: any) => edge.target).sort()).toEqual(map.entries.map((item: any) => item.place.key).sort())
    expect(entered.find((edge: any) => edge.target === WEB_CATALOG).label).toBe('/')
    expect(entered.find((edge: any) => edge.target === 'interface:operator-cli').label).toBe('fixture-shop admin')
    for (const edge of diagram.edges) expect(diagram.nodes.some((node: any) => node.id === edge.source) && diagram.nodes.some((node: any) => node.id === edge.target), edge.id).toBe(true)
  })

  it('marks an always-reachable Screen and keeps an unwalked place as an island', () => {
    const report = reportOf(shopRoot)
    const catalog = report.model.screens.find(screen => screen.id === 'customer-web::catalog')!
    report.model.screens.push({ ...catalog, id: 'customer-web::help', title: 'Help', capabilityIds: [], capabilityScenarioIds: [], journeyScenarioIds: [], entryPoints: [], references: [] })
    report.model.interfaces.find(item => item.id === 'customer-web')!.navigation.push('customer-web::help')
    const edited = projectReportWorkspace(report)
    const help = edited.screens.find((screen: any) => screen.id === 'customer-web::help')
    expect(help.alwaysReachable).toBe(true)
    const derived = projections.uiMapProjection(edited)
    expect(derived.moves.some((item: any) => item.from.key === help.key || item.to.key === help.key)).toBe(false)
    const diagram = uiMapDiagram(derived.places, derived, state.defaultTopologyReading())
    expect(diagram.nodes.find((node: any) => node.id === help.key)).toMatchObject({ navigation: true, parent: 'interface:customer-web' })
    expect(diagram.edges.some((edge: any) => edge.source === help.key || edge.target === help.key)).toBe(false)
    // Every move is a Step's doing: a place no Step names is drawn and touched by nothing.
    const named = new Set(edited.scenarios.flatMap((scenario: any) => scenario.steps.flatMap((step: any) => step.contexts.map((context: any) => context.context.id))))
    const islands = diagram.nodes.filter((node: any) => node.resourceKey && !named.has(node.resourceKey.replace(/^[a-z]+:/, '')))
    expect(islands.length).toBeGreaterThan(1)
    for (const island of islands) expect(diagram.edges.some((edge: any) => edge.source !== UI_MAP_ENTRY && (edge.source === island.id || edge.target === island.id)), island.id).toBe(false)
    expect(derived.moves).toEqual(map.moves.map((item: any) => expect.objectContaining({ id: item.id })))
  })

  it('closes a frame into one node that stands in for its contents, once per Capability', () => {
    const closed = { ...state.defaultTopologyReading(), collapsed: ['interface:customer-web'] }
    const diagram = uiMapDiagram(map.places, map, closed)
    expect(diagram.nodes.some((node: any) => node.parent === 'interface:customer-web' || node.id.startsWith('screen:customer-web::') || node.id === 'experience:customer-web::storefront')).toBe(false)
    expect(diagram.nodes.find((node: any) => node.id === 'interface:customer-web')).toMatchObject({ group: undefined, branch: expect.objectContaining({ open: false }) })
    const settled = diagram.edges.filter((edge: any) => edge.source === 'interface:customer-web' && edge.target === WEBHOOK)
    expect(settled).toHaveLength(1)
    expect(settled[0].label).toBe('Payment settlement')
    // A move inside the closed frame is not drawn; the Scenarios that walked in are still named.
    expect(diagram.edges.some((edge: any) => edge.source === edge.target)).toBe(false)
    expect(diagram.edges.find((edge: any) => edge.source === UI_MAP_ENTRY && edge.target === 'interface:customer-web').label.split(' · ').sort()).toEqual(['/', '/orders/:id', '/products/:id'])
    const open = uiMapDiagram(map.places, map, state.defaultTopologyReading())
    expect(open.nodes.find((node: any) => node.id === 'interface:customer-web').branch).toMatchObject({ open: true, childrenLabel: 'branches' })
  })

  it('keeps the focus neighbourhood one move wide as well as one subtree deep', () => {
    const focus = topologyNeighbourhood(workspace, [WEBHOOK], map.places, map.moves.map((item: any) => ({ source: item.from.key, target: item.to.key })))
    expect(focus.has(WEB_PRODUCT)).toBe(true)
    expect(focus.has(ADMIN_ORDER)).toBe(true)
    expect(focus.has(WEB_CATALOG)).toBe(false)
    const shown = projections.filterBranches(map.places, (resource: any) => focus.has(resource.key))
    const diagram = uiMapDiagram(shown, map, state.defaultTopologyReading())
    expect(diagram.nodes.map((node: any) => node.id)).toContain('experience:customer-web::storefront')
    expect(diagram.nodes.map((node: any) => node.id)).not.toContain(WEB_CATALOG)
    for (const edge of diagram.edges) expect(diagram.nodes.some((node: any) => node.id === edge.source) && diagram.nodes.some((node: any) => node.id === edge.target), edge.id).toBe(true)
  })
})

describe('topology reading state', () => {
  it('round trips qualified IDs as repeated query values without delimiter ambiguity', () => {
    const reading = { ...state.defaultTopologyReading(), view: 'ui-map', focus: ['screen:a::b::c', 'entity:a,b'], expanded: ['kind:entity'], collapsed: ['kind:rule'] }
    expect(state.topologyFromQuery(state.topologyToQuery(reading))).toEqual(reading)
    expect(Object.values(state.topologyToQuery(state.defaultTopologyReading())).every(value => value === undefined)).toBe(true)
    expect(state.topologyFromQuery({ tv: 'made-up', th: ['not-a-kind'] })).toEqual(state.defaultTopologyReading())
    const matrixReading = { ...state.defaultTopologyReading(), view: 'rule-attachments', focus: ['rule:one', 'entity:a,b', 'screen:web::item'] }
    expect(state.topologyFromQuery(state.topologyToQuery(matrixReading))).toEqual(matrixReading)
  })
  it('preserves surviving resources after an edit and clears removed selections', () => {
    const workspace = workspaceOf()
    const reading = { ...state.defaultTopologyReading(), focus: [workspace.entities[0].key, 'entity:removed'], column: 'removed', expanded: ['kind:entity', 'domain:removed'], collapsed: ['kind:entity', 'invalid'] }
    const next = state.sanitizeTopologyReading(reading, workspace)
    expect(next.focus).toEqual([workspace.entities[0].key])
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
    expect(state.topologyPushesHistory(before, { ...before, view: 'ui-map' })).toBe(true)
    expect(state.topologyPushesHistory(before, { ...before, focus: ['entity:order'] })).toBe(true)
    expect(state.topologyPushesHistory(before, { ...before, hiddenKinds: ['entity'] })).toBe(false)
    expect(state.topologyPushesHistory(before, { ...before, expanded: ['kind:entity'] })).toBe(false)
    expect(state.topologyPushesHistory({ ...before, focus: ['entity:removed'], column: 'removed' }, before)).toBe(false)
  })
})
