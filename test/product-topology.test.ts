import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'

// Renderer utilities use Nuxt's bundler resolution, not root NodeNext imports.
const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const { projectReportWorkspace } = await utility('reportWorkspace')
const projections = await utility('topologyProjections')
const { ruleAttachments } = await utility('topologyTargets')
const { relationshipBadges } = await utility('matrixBadges')
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
  it('keeps nine questions with explicit diagram types and stable view IDs', () => {
    expect(PRODUCT_TOPOLOGY_VIEWS.map((view: any) => view.id)).toEqual(['domain-reach', 'capability-reach', 'journey-reach', 'rule-reach', 'sitemap', 'what-it-keeps', 'delivery-by-interface', 'rule-attachments', 'what-changes-what'])
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
    capability.entityEffects.find((item: any) => item.entityId === 'blueprint').effects.push({ effect: 'creates', from: '', to: 'Proposed' })
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

describe('topology reading state', () => {
  it('round trips qualified IDs as repeated query values without delimiter ambiguity', () => {
    const reading = { ...state.defaultTopologyReading(), view: 'sitemap', focus: ['screen:a::b::c', 'entity:a,b'], expanded: ['kind:entity'], collapsed: ['kind:rule'] }
    expect(state.topologyFromQuery(state.topologyToQuery(reading))).toEqual(reading)
    expect(Object.values(state.topologyToQuery(state.defaultTopologyReading())).every(value => value === undefined)).toBe(true)
    expect(state.topologyFromQuery({ tv: 'made-up', th: ['not-a-kind'] })).toEqual(state.defaultTopologyReading())
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
    expect(state.topologyPushesHistory(before, { ...before, view: 'sitemap' })).toBe(true)
    expect(state.topologyPushesHistory(before, { ...before, focus: ['entity:order'] })).toBe(true)
    expect(state.topologyPushesHistory(before, { ...before, hiddenKinds: ['entity'] })).toBe(false)
    expect(state.topologyPushesHistory(before, { ...before, expanded: ['kind:entity'] })).toBe(false)
    expect(state.topologyPushesHistory({ ...before, focus: ['entity:removed'], column: 'removed' }, before)).toBe(false)
  })
})
