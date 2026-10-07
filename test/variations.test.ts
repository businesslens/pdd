import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { lintModel } from '../src/commands/lint.js'
import { expandProductReport } from '../src/commands/open.js'
import { loadModel, type PddModel, type VariationResource } from '../src/core/model.js'
import { ProductReportV17Schema, projectPortableReport, validateProductReport } from '../src/core/portable.js'
import {
  VARIATION_COLLECTION_OF, VARIATION_KINDS, VARIATION_MEMBER_TYPES, type VariationKind, type VariationMemberType, type VariationSet
} from '../src/core/variations.js'

const ROOT = join(__dirname, '..', 'blueprints/content-feed-reader')
const PERSONAL = 'reader-mobile::personal-library'
const SOURCE = 'reader-mobile::source-focused-library'
const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })
const model = () => loadModel(ROOT)
const report = () => compileReport(model(), '2026-09-27')
const temporary = () => { const dir = mkdtempSync(join(tmpdir(), 'bl-variations-')); dirs.push(dir); return dir }
const LIBRARY_FACT = { entity: 'reader', fact: 'Library assignment' }

/** Selection fields for one subtype, with every field outside it cleared. */
function selection(kind: VariationKind): Omit<VariationSet, 'id' | 'kind' | 'of' | 'alternatives'> {
  const base = {
    takesEffect: 'At session start.', stability: 'Fixed until the session ends.',
    assignmentUnit: null, assignmentMethod: null, assignmentFact: null, allocation: null, settings: [], discriminator: null
  }
  if (kind === 'experiment') return { ...base, assignmentUnit: { entity: 'reader' }, assignmentMethod: 'Assigned randomly per Reader.', assignmentFact: LIBRARY_FACT, allocation: 'Half of eligible Readers.' }
  if (kind === 'version') return { ...base, discriminator: LIBRARY_FACT }
  return { ...base, settings: [LIBRARY_FACT] }
}

/** Two Scenarios that share an owner, from `[owner, id]` pairs. */
function siblings(pairs: [string, string][]): string[] {
  const byOwner = new Map<string, string[]>()
  for (const [owner, id] of pairs) byOwner.set(owner, [...(byOwner.get(owner) ?? []), id])
  return [...byOwner.values()].find(ids => ids.length >= 2)!.slice(0, 2)
}

function withSet(loaded: PddModel, kind: VariationKind, of: VariationMemberType, ids: string[]): VariationResource {
  const template = loaded.variations[0]!
  const set: VariationResource = {
    ...template,
    ...selection(kind),
    id: 'chosen-form',
    kind,
    of,
    alternatives: ids.map((id, index) => ({ id, selectedWhen: `Choice ${index + 1}.`, label: kind === 'version' ? `v${index + 1}` : null }))
  }
  // The library set also justifies reader-mobile holding Experiences; keep it unless this set replaces it.
  loaded.variations = of === 'experience' ? [set] : [template, set]
  return set
}

const cases = VARIATION_MEMBER_TYPES.flatMap(of => VARIATION_KINDS.map(kind => ({ of, kind })))

describe('Variation resources', () => {
  it('loads the library set with membership only on the set', () => {
    const loaded = model()
    expect(loaded.variations.map(item => [item.id, item.kind, item.of, item.alternatives.map(alt => alt.id)])).toEqual([
      ['library-organization', 'configuration', 'experience', [PERSONAL, SOURCE]]
    ])
    expect(lintModel(loaded, []).errors).toEqual([])
  })

  it.each(cases)('round-trips a $kind set of $of losslessly', ({ of, kind }) => {
    const loaded = model()
    const collection = VARIATION_COLLECTION_OF[of]
    const ids = of === 'experience' ? [PERSONAL, SOURCE]
      : of === 'capability-scenario' ? siblings(loaded.capabilityScenarios.map(item => [item.capability, item.id]))
        : of === 'journey-scenario' ? siblings(loaded.journeyScenarios.map(item => [item.journey, item.id]))
          : loaded[collection].slice(0, 2).map(item => item.id)
    expect(ids).toHaveLength(2)
    withSet(loaded, kind, of, ids)
    expect(lintModel(loaded, []).errors).toEqual([])
    const original = compileReport(loaded, '2026-09-27')
    expect(validateProductReport(original)).toEqual([])
    const wire = original.model.variations.find(item => item.id === 'chosen-form')!
    expect(wire).toMatchObject({ kind, of, takesEffect: 'At session start.' })
    expect(wire.alternatives.map(item => item.resourceId)).toEqual([...ids].sort())
    expect(wire.alternatives.every(item => (item.label !== null) === (kind === 'version'))).toBe(true)
    expect(original.counts.variations).toBe(original.model.variations.length)
    const portable = projectPortableReport(original)
    const target = temporary()
    expandProductReport(target, portable, false)
    const reopened = loadModel(target)
    expect(lintModel(reopened, []).errors).toEqual([])
    expect(compileReport(reopened, '2026-09-27').model.variations).toEqual(portable.model.variations)
  })

  it('writes the alternatives as a set, ordered by id', () => {
    const loaded = model()
    loaded.variations[0]!.alternatives.reverse()
    const wire = compileReport(loaded, '2026-09-27')
    expect(wire.model.variations[0]!.alternatives.map(item => item.resourceId)).toEqual([PERSONAL, SOURCE])
  })

  const rejections: Array<[string, (set: VariationSet) => void, string]> = [
    ['one alternative', set => { set.alternatives = set.alternatives.slice(0, 1) }, 'at least two alternatives'],
    ['a missing alternative', set => { set.alternatives[1]!.id = 'reader-mobile::missing' }, 'references missing experience'],
    ['a repeated alternative', set => { set.alternatives[1]!.id = set.alternatives[0]!.id }, 'is listed twice'],
    ['an unknown subtype', set => { set.kind = 'rollout' }, 'kind must be'],
    ['an unknown member type', set => { set.of = 'domain' }, 'of must be'],
    ['a field outside the subtype', set => { set.discriminator = LIBRARY_FACT }, 'does not belong on a configuration Variation'],
    ['a label outside a version', set => { set.alternatives[0]!.label = 'v1' }, 'label belongs only on a version Variation'],
    ['a missing setting Entity', set => { set.settings = [{ entity: 'missing', fact: 'Library assignment' }] }, 'missing Entity'],
    ['a missing setting fact', set => { set.settings = [{ entity: 'reader', fact: 'Missing fact' }] }, 'missing fact'],
    ['a repeated fact', set => { set.settings = [LIBRARY_FACT, LIBRARY_FACT] }, 'repeats fact'],
    ['empty timing', set => { set.takesEffect = '  ' }, 'takesEffect'],
    ['empty selection', set => { set.alternatives[0]!.selectedWhen = '' }, 'selectedWhen']
  ]
  it.each(rejections)('rejects %s in the folder and on the wire', (_name, mutate, message) => {
    const loaded = model()
    mutate(loaded.variations[0]!)
    expect(lintModel(loaded, []).errors.join('\n')).toContain(message)
    const wire = report()
    const record = wire.model.variations[0]!
    const set = { ...record, alternatives: record.alternatives.map(item => ({ id: item.resourceId, selectedWhen: item.selectedWhen, label: item.label })) }
    mutate(set)
    Object.assign(record, { ...set, alternatives: set.alternatives.map(item => ({ resourceId: item.id, selectedWhen: item.selectedWhen, label: item.label })) })
    const parsed = ProductReportV17Schema.safeParse(wire)
    if (parsed.success) expect(validateProductReport(wire).join('\n')).toContain(message)
    else expect(parsed.error.issues.some(issue => issue.path[0] === 'model' && issue.path[1] === 'variations')).toBe(true)
  })

  it('requires experiment assignment and version labels, unique ignoring case', () => {
    const experiment = model()
    withSet(experiment, 'experiment', 'screen', experiment.screens.slice(0, 2).map(item => item.id))
    const set = experiment.variations.find(item => item.id === 'chosen-form')!
    set.assignmentUnit = null
    set.assignmentMethod = null
    const errors = lintModel(experiment, []).errors.join('\n')
    expect(errors).toContain('needs assignmentUnit')
    expect(errors).toContain('needs assignmentMethod')
    const version = model()
    withSet(version, 'version', 'business-rule', version.businessRules.slice(0, 2).map(item => item.id))
    const versions = version.variations.find(item => item.id === 'chosen-form')!
    versions.alternatives[1]!.label = 'V1'
    expect(lintModel(version, []).errors.join('\n')).toContain('must be unique')
    versions.alternatives[1]!.label = null
    expect(lintModel(version, []).errors.join('\n')).toContain('needs a label')
  })

  it('varies Scenarios only within one owner, and never Domains', () => {
    const loaded = model()
    const owners = new Map<string, string>()
    const apart = loaded.capabilityScenarios.filter(item => !owners.has(item.capability) && owners.set(item.capability, item.id)).slice(0, 2).map(item => item.id)
    withSet(loaded, 'configuration', 'capability-scenario', apart)
    expect(lintModel(loaded, []).errors.join('\n')).toContain('alternatives must be Scenarios of one Capability; vary the Capabilities instead')
    const domains = model()
    withSet(domains, 'configuration', 'domain' as VariationMemberType, ['reading', 'sources'])
    expect(lintModel(domains, []).errors.join('\n')).toContain('of must be interface|experience|screen|entity|capability|capability-scenario|journey|journey-scenario|business-rule')
  })

  it('lets a resource join at most one Variation', () => {
    const loaded = model()
    loaded.variations.push({ ...loaded.variations[0]!, id: 'second-layout' })
    expect(lintModel(loaded, []).errors.join('\n')).toContain('already belongs to Variation "library-organization"')
    const wire = report()
    wire.model.variations.push({ ...wire.model.variations[0]!, id: 'second-layout' })
    wire.counts.variations = 2
    expect(validateProductReport(wire).join('\n')).toContain('already belongs to Variation')
  })

  it('reports malformed Variation frontmatter as findings', () => {
    const target = temporary()
    expandProductReport(target, report(), false)
    const file = loadModel(target).variations[0]!.file
    writeFileSync(file, readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, [
      '---', 'kind: configuration', 'of: experience', 'settings: []', 'takesEffect: Now.', 'stability: Always.', 'alternatives: nope', '---', ''
    ].join('\n')))
    const errors = lintModel(loadModel(target), []).errors.join('\n')
    expect(errors).toContain('"alternatives" must be a list')
    expect(errors).toContain('settings must be a non-empty list')
  })

  it('justifies Experiences through membership alone', () => {
    const loaded = model()
    // Break the reader-web counterpart so membership is the only justification left.
    for (const experience of loaded.experiences.filter(item => item.interface === 'reader-web')) experience.id += '-web'
    const justification = 'none is a counterpart or Variation'
    expect(lintModel(loaded, []).errors.join('\n')).not.toContain(justification)
    loaded.variations = []
    expect(lintModel(loaded, []).errors.join('\n')).toContain(justification)
  })

  it('counts an Entity used only for selection as meaningful use', () => {
    const loaded = model()
    const template = loaded.entities.find(item => item.id === 'reader')!
    loaded.entities.push({ ...template, id: 'selection-settings', file: 'selection-settings.md', acts: undefined, kind: undefined, relations: [], states: [] })
    loaded.variations[0]!.settings = [{ entity: 'selection-settings', fact: 'Library assignment' }]
    expect(lintModel(loaded, []).errors).toEqual([])
    expect(validateProductReport(compileReport(loaded, '2026-09-27'))).toEqual([])
    loaded.variations[0]!.settings = [LIBRARY_FACT]
    expect(lintModel(loaded, []).errors.join('\n')).toContain('selection-settings.md: no Step changes it')
  })

  it('never treats a Rule alternative as an unconditional prohibition', () => {
    const loaded = model(), base = loaded.businessRules[0]!
    loaded.businessRules.push({ ...base, id: 'conditional-denial', file: 'conditional-denial.md',
      appliesTo: [{ type: 'entity', id: 'source', effect: 'reads', facts: [], contexts: [] }], permits: []
    }, { ...base, id: 'conditional-access', file: 'conditional-access.md',
      appliesTo: [{ type: 'entity', id: 'source', effect: 'reads', facts: [], contexts: [] }],
      permits: [{ actors: ['reader'], related: [], when: [], unattended: true }]
    })
    withSet(loaded, 'configuration', 'business-rule', ['conditional-access', 'conditional-denial'])
    const result = lintModel(loaded, [])
    expect(result.errors).toEqual([])
    expect(validateProductReport(compileReport(loaded, '2026-09-27'))).toEqual([])
    // Without the set, the same Rules are ordinary policy again and contradict the Steps.
    loaded.variations = loaded.variations.filter(item => item.id !== 'chosen-form')
    expect(lintModel(loaded, []).errors.join('\n')).toContain('forbids')
    expect(() => compileReport(loaded, '2026-09-27')).toThrow('forbids')
  })
})

const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const { projectReportWorkspace } = await utility('reportWorkspace')
const { collapseVariations, titledBy, variationAlternatives, variationPickerLabel, variationsByOwner, variationChooser } = await utility('variations')
const { resourceAncestors, resourceDomains } = await utility('reportDestinations')
const { absenceLabel } = await utility('placeReadings')
const projections = await utility('topologyProjections')
const lifecycle = await utility('entityLifecycle')
const { adjacentAlternatives, variationCondition } = await utility('variations')
const { resourceConnectionRows } = await utility('resourceConnections')
const { tabsFor } = await utility('pageSections')
const { structureChildren, insideSummary, treeCards } = await utility('collectionChildren')
const { collectionGroups } = await utility('resourceFacets')
const { attachedRules } = await utility('topologyTargets')
const SHOP = join(__dirname, 'fixtures/fixture-shop')
const shop = () => projectReportWorkspace(compileReport(loadModel(SHOP), '2026-09-27'))

describe('Variations in the Product Report', () => {
  it('projects each set as a resource and each alternative with its own selection', () => {
    const workspace = shop()
    expect(workspace.variations.map((item: any) => [item.id, item.variationKind, item.memberKind])).toEqual([
      ['cancellation-handling', 'configuration', 'capability'],
      ['checkout-review', 'experiment', 'capability-scenario'],
      ['mobile-storefront', 'configuration', 'experience'],
      ['order-confirmation', 'configuration', 'journey-scenario'],
      ['payment-webhook-contract', 'version', 'interface'],
      ['post-purchase', 'experiment', 'journey'],
      ['refund-review', 'configuration', 'rule'],
      ['stock-disclosure', 'experiment', 'screen'],
      ['tax-document', 'configuration', 'entity'],
      ['tax-document-issue', 'configuration', 'capability-scenario']
    ])
    expect(workspace.counts.variations).toBe(10)
    // An Entity set is drawn by the facet its alternatives play, never the Entities collection glyph.
    expect(workspace.byKey.get('variation:tax-document').memberFacet).toBe('kept')
    expect(workspace.byKey.get('variation:refund-review').memberFacet).toBeNull()
    const strict = workspace.byKey.get('rule:refund-review-strict')
    expect(strict.variation).toEqual({ key: 'variation:refund-review', id: 'refund-review', title: 'Refund review', kind: 'configuration', selectedWhen: 'Refund review mode is Strict.', label: null })
    const set = workspace.byKey.get('variation:refund-review')
    expect(variationAlternatives(workspace, set).map((item: any) => item.id)).toEqual(['refund-review-standard', 'refund-review-strict'])
    // An alternative is titled by its set; the picker beside the title names the alternative.
    expect(titledBy(workspace, strict).key).toBe('variation:refund-review')
    expect(titledBy(workspace, set).key).toBe('variation:refund-review')
    expect(titledBy(workspace, workspace.byKey.get('rule:margin-is-for-operators')).key).toBe('rule:margin-is-for-operators')
    expect(variationPickerLabel(workspace, set)).toBe('2 alternatives')
    expect(variationPickerLabel(workspace, strict)).toBe('Strict refund review')
    expect(variationPickerLabel(workspace, workspace.byKey.get('interface:payment-webhook-v2'))).toBe('v2')
    expect(variationPickerLabel(workspace, workspace.byKey.get('rule:margin-is-for-operators'))).toBeUndefined()
    expect(variationChooser(workspace, set)).toEqual({ label: 'Chosen by', text: 'Store settings · Refund review mode' })
    expect(variationChooser(workspace, workspace.byKey.get('variation:stock-disclosure'))?.label).toBe('Assigned per')
  })

  it('reads a set as Overview, Alternatives and Connections, and an alternative with how it is chosen', () => {
    const workspace = shop()
    const set = workspace.byKey.get('variation:refund-review')
    const tabs = tabsFor(workspace, set)
    expect(tabs.map((tab: any) => tab.id)).toEqual(['overview', 'alternatives', 'connections'])
    expect(tabs[0].blocks).toContain('selection')
    expect(tabs[1]).toMatchObject({ label: 'Alternatives', count: 2, blocks: ['alternatives'] })
    const strictTabs = tabsFor(workspace, workspace.byKey.get('rule:refund-review-strict'))
    expect(strictTabs[0].blocks).toContain('variation-choice')
    expect(strictTabs.map((tab: any) => tab.id)).not.toContain('variations')
    expect(tabsFor(workspace, workspace.byKey.get('rule:margin-is-for-operators'))[0].blocks).not.toContain('variation-choice')
  })

  it('connects a set to its alternatives and to what it chooses by, never alternatives to each other', () => {
    const workspace = shop()
    const setRows = resourceConnectionRows(workspace, workspace.byKey.get('variation:refund-review'))
    expect(setRows.find((row: any) => row.label === 'Alternatives')).toMatchObject({ kind: 'rule', ids: ['refund-review-standard', 'refund-review-strict'] })
    expect(setRows.some((row: any) => row.label === 'chooses by setting: Refund review mode' && row.ids.includes('store-settings'))).toBe(true)
    const memberRows = resourceConnectionRows(workspace, workspace.byKey.get('rule:refund-review-strict'))
    expect(memberRows.some((row: any) => row.label === 'alternative in' && row.ids.includes('refund-review'))).toBe(true)
    expect(memberRows.some((row: any) => row.ids.includes('refund-review-standard'))).toBe(false)
  })

  it('collapses alternatives that meet in a list into one set row, and keeps a lone one', () => {
    const workspace = shop()
    const rules = workspace.rules
    const rows = collapseVariations(workspace, rules)
    expect(rows.filter((item: any) => item.kind === 'variation').map((item: any) => item.id)).toEqual(['refund-review'])
    expect(rows.some((item: any) => item.id === 'refund-review-strict')).toBe(false)
    expect(rows).toHaveLength(rules.length - 1)
    const lone = collapseVariations(workspace, rules.filter((item: any) => item.id !== 'refund-review-standard'))
    expect(lone.some((item: any) => item.id === 'refund-review-strict')).toBe(true)
    // Tabs collapse too: Refund names both refund review alternatives.
    const attached = attachedRules(workspace, workspace.byKey.get('entity:refund')).map((item: any) => item.rule)
    expect(collapseVariations(workspace, attached).filter((item: any) => item.kind === 'variation')).toHaveLength(1)
  })

  it('groups the Variations collection by the type each set varies, and the fixture varies every type', () => {
    const workspace = shop()
    const groups = collectionGroups(workspace, 'variation', workspace.variations)
    expect(groups.map((group: any) => [group.kind, group.title, group.resources.map((item: any) => item.id)])).toEqual([
      ['entity', 'Entities', ['tax-document']],
      ['interface', 'Interfaces', ['payment-webhook-contract']],
      ['experience', 'Experiences', ['mobile-storefront']],
      ['screen', 'Screens', ['stock-disclosure']],
      ['capability', 'Capabilities', ['cancellation-handling']],
      ['journey', 'Journeys', ['post-purchase']],
      ['capability-scenario', 'Capability Scenarios', ['checkout-review', 'tax-document-issue']],
      ['journey-scenario', 'Journey Scenarios', ['order-confirmation']],
      ['rule', 'Business Rules', ['refund-review']]
    ])
    // The golden fixture is the example set: every type that can vary, and every subtype.
    expect(groups).toHaveLength(VARIATION_MEMBER_TYPES.length)
    expect(new Set(workspace.variations.map((item: any) => item.variationKind))).toEqual(new Set(VARIATION_KINDS))
  })

  it('places a set where all its alternatives sit, and a Scenario set under its one owner', () => {
    const workspace = shop()
    const checkout = workspace.byKey.get('variation:checkout-review')
    expect(resourceAncestors(workspace, checkout).map((item: any) => item.key)).toEqual(['capability:place-order'])
    expect(resourceDomains(workspace, checkout).map((item: any) => item.id)).toEqual(['ordering'])
    expect(resourceAncestors(workspace, workspace.byKey.get('variation:order-confirmation')).map((item: any) => item.key)).toEqual(['journey:browse-and-buy'])
    // Alternatives in different places leave the set without one.
    expect(resourceAncestors(workspace, workspace.byKey.get('variation:refund-review'))).toEqual([])
    const scenarioSets = workspace.variations.filter((item: any) => item.memberKind === 'capability-scenario')
    expect(variationsByOwner(workspace, scenarioSets).map((part: any) => [part.owner?.title, part.resources.map((item: any) => item.id)])).toEqual([
      ['Checkout', ['checkout-review']],
      ['Payment settlement', ['tax-document-issue']]
    ])
    // Other sets keep their place, with no owner.
    const rules = workspace.variations.filter((item: any) => item.memberKind === 'rule')
    expect(variationsByOwner(workspace, rules)).toEqual([{ resources: rules }])
  })

  it('folds sibling alternatives under one tree node while counts stay concrete', () => {
    const workspace = shop()
    const web = treeCards(workspace, 'interface', workspace.interfaces, false).find((card: any) => card.key === 'interface:customer-web')
    const storefront = web.children[0].children.find((node: any) => node.resource?.id === 'customer-web::storefront')
    const screens = storefront.children.find((node: any) => node.groupKind === 'screen')
    expect(screens.count).toBe(3)
    const set = screens.children.find((node: any) => node.resource?.kind === 'variation')
    expect(set.resource.id).toBe('stock-disclosure')
    expect(set.children.map((node: any) => node.resource.id)).toHaveLength(2)
    expect(set.children.every((node: any) => node.inSet)).toBe(true)
    // Each alternative keeps its own children; the set is not counted as something inside.
    expect(set.children.some((node: any) => node.children.length > 0)).toBe(true)
    expect(insideSummary(screens).some((entry: any) => entry.kind === 'variation')).toBe(false)
    // The Experience's own structure reads the same set, holding both Screens.
    const structure = structureChildren(workspace, workspace.byKey.get('experience:customer-web::storefront'))
    const disclosure = structure.find((node: any) => node.groupKind === 'screen').children.find((node: any) => node.resource?.key === 'variation:stock-disclosure')
    expect(disclosure.children.map((node: any) => [node.resource.key, node.inSet])).toEqual([
      ['screen:customer-web::storefront::product-record', true], ['screen:customer-web::storefront::product-record-without-stock', true]
    ])
    // Capabilities that vary fold where a place delivers both, so a set's title appears once.
    const flatten = (nodes: any[]): any[] => nodes.flatMap(node => [node, ...flatten(node.children)])
    const admin = treeCards(workspace, 'interface', workspace.interfaces, false).find((item: any) => item.key === 'interface:admin-web')
    const handling = flatten(admin.children).filter((node: any) => node.resource?.id === 'cancellation-handling')
    expect(handling).toHaveLength(1)
    expect(handling[0].children.map((node: any) => [node.resource.kind, Boolean(node.absentFrom)])).toEqual([['capability', false], ['capability', false]])
    // A place holding one alternative still reads as a choice: the absent one follows, struck, with no children.
    const mobile = treeCards(workspace, 'interface', workspace.interfaces, false).find((item: any) => item.key === 'interface:customer-mobile')
    const status = flatten(mobile.children).find((node: any) => node.resource?.id === 'customer-mobile::storefront::order-status')
    const lone = status.children.find((node: any) => node.resource?.id === 'cancellation-handling')
    expect(lone.place.key).toBe(status.resource.key)
    expect(lone.children.map((node: any) => [node.resource.id, node.absentFrom?.key ?? null, node.children.length > 0]))
      .toEqual([['cancel-order', null, true], ['request-cancellation', status.resource.key, false]])
    expect(absenceLabel(status.resource)).toBe('Not on this Screen')
    // Nothing counts a struck alternative.
    expect(insideSummary(status).find((entry: any) => entry.kind === 'capability')?.count).toBe(status.resource.capabilityIds.length)
    expect(flatten(mobile.children).some((node: any) => node.resource?.variation && !node.inSet)).toBe(false)
  })

  it('reads a change as conditional only when some choice of alternatives leaves nothing making it', () => {
    const workspace = shop()
    const order = workspace.byKey.get('entity:order')
    const condition = (from: string, to: string) => lifecycle.lifecycleArcCondition(workspace, order, order.arcs.find((arc: any) => arc.from === from && arc.to === to))
    // Merge duplicate orders cancels a pending Order in every store; the immediate policy also does, on its own.
    const pending = condition('Pending', 'Cancelled')
    expect(pending.conditional).toBe(false)
    expect(pending.groups.map((group: any) => group.choices.map((choice: any) => choice.alternative.id))).toEqual([[], ['cancel-order']])
    // Only Order cancellation (or a Journey arm using it) cancels a confirmed Order.
    expect(condition('Confirmed', 'Cancelled').conditional).toBe(true)
    // Both Checkout review arms create the Order, so it is created whichever runs.
    const checkout = workspace.byKey.get('capability:place-order')
    const arms = workspace.capabilityScenarios.filter((item: any) => item.capabilityId === checkout.id && item.variation)
    expect(variationCondition(workspace, arms).conditional).toBe(false)
    expect(variationCondition(workspace, arms.slice(0, 1)).conditional).toBe(true)
    // A State only conditional changes reach is conditional, and says under which alternative.
    expect(lifecycle.lifecycleStateCondition(workspace, order, 'Cancellation requested')).toBe('Only under Cancellation request')
    expect(lifecycle.lifecycleStateCondition(workspace, order, 'Cancelled')).toBeNull()
    const graph = lifecycle.buildEntityLifecycle(workspace, order)
    expect(graph.nodes.filter((node: any) => node.conditional).map((node: any) => node.title)).toEqual(['Cancellation requested'])
    expect(graph.edges.filter((edge: any) => edge.conditional).map((edge: any) => edge.inspectionLabel).sort())
      .toEqual(['Cancellation requested → Cancelled', 'Confirmed → Cancelled', 'Pending → Cancellation requested'])
  })

  it('sets alternatives side by side on matrix axes and dashes cells only some choices hold', () => {
    const workspace = shop()
    expect(adjacentAlternatives(workspace.capabilities).map((item: any) => item.id).indexOf('request-cancellation'))
      .toBe(adjacentAlternatives(workspace.capabilities).map((item: any) => item.id).indexOf('cancel-order') + 1)
    const delivery = projections.deliveryMatrixProjection(workspace)
    const conditional = delivery.cells.filter((cell: any) => cell.condition)
    // On mobile, only the Shopping storefront sells; Catalog preview only shows the catalog.
    expect(conditional.map((cell: any) => cell.id).sort()).toEqual([
      'capability:cancel-order->interface:customer-mobile', 'capability:place-order->interface:customer-mobile', 'capability:track-order->interface:customer-mobile'
    ])
    expect(conditional.every((cell: any) => cell.condition === 'Only under Mobile storefront: Shopping')).toBe(true)
    // Both Stock disclosure arms carry Checkout, so web delivery is unconditional.
    expect(delivery.cells.find((cell: any) => cell.id === 'capability:place-order->interface:customer-web').condition).toBeUndefined()
    const mutations = projections.mutationProjection(workspace)
    const cell = (id: string) => mutations.cells.find((item: any) => item.id === id)
    expect(cell('entity:shopper->capability:place-order').condition).toBe('Only under Checkout review: Complete checkout')
    // A cell is never dashed for its own column's Variation.
    expect(cell('entity:order->capability:cancel-order').condition).toBeUndefined()
    // Order management stays solid while one change inside it is conditional.
    const management = cell('entity:order->capability:manage-orders')
    expect(management.condition).toBeUndefined()
    expect(management.mutations[0].variants.filter((variant: any) => variant.condition).map((variant: any) => `${variant.from}>${variant.to}`)).toEqual(['Pending>Confirmed'])
  })

  it('folds graph trees like the Rows tree and frames an Entity Variation', () => {
    const workspace = shop()
    const reach = projections.reachTreeProjection(workspace, 'capability')
    const handling = reach.children.find((item: any) => item.resource?.key === 'variation:cancellation-handling')
    expect(handling.id).toBe('variation:cancellation-handling')
    expect(handling.children.map((item: any) => [item.resource.id, item.inSet, Boolean(item.absentFrom)])).toEqual([['cancel-order', true, false], ['request-cancellation', true, false]])
    expect(projections.concreteBranches(reach.children)).toHaveLength(workspace.capabilities.length)
    // What a subject reaches folds too: the two webhook contracts Payment settlement is available in.
    const settlement = reach.children.find((item: any) => item.resource?.id === 'settle-payment')
    const contract = settlement.children.find((item: any) => item.resource?.id === 'payment-webhook-contract')
    expect(contract.children.map((item: any) => [item.resource.id, item.inSet, Boolean(item.absentFrom)])).toEqual([['payment-webhook', true, false], ['payment-webhook-v2', true, false]])
    const rules = projections.reachTreeProjection(workspace, 'rule')
    const payment = rules.children.find((item: any) => item.resource?.id === 'payment-before-confirmation')
    const postPurchase = payment.children.find((item: any) => item.resource?.id === 'post-purchase')
    expect(postPurchase.children.map((item: any) => [item.resource.id, Boolean(item.absentFrom)])).toEqual([['browse-and-buy', false]])
    // At a place, an alternative not there is struck, with no children.
    const flatten = (nodes: any[]): any[] => nodes.flatMap(node => [node, ...flatten(node.children)])
    const map = flatten([projections.deliveryMapProjection(workspace)])
    const status = map.find((item: any) => item.id.endsWith('screen:customer-mobile::storefront::order-status') && item.resource?.kind === 'screen')
    const set = status.children.find((item: any) => item.resource?.id === 'cancellation-handling')
    expect(set.children.map((item: any) => [item.resource.id, item.absentFrom?.key ?? null, item.children.length])).toEqual([
      ['cancel-order', null, 1], ['request-cancellation', status.resource.key, 0]
    ])
    expect(map.some((item: any) => item.note === 'Available here, on no Screen' || item.note === 'Delivered directly')).toBe(false)
    const erd = projections.entityRelationsProjection(workspace)
    expect(erd.nodes.filter((node: any) => node.group).map((node: any) => node.id)).toEqual(['variation:tax-document'])
    expect(erd.nodes.filter((node: any) => node.parent === 'variation:tax-document').map((node: any) => node.id).sort()).toEqual(['entity:sales-tax-receipt', 'entity:vat-invoice'])
    // Relations keep their concrete ends: each tax document is issued for an Order.
    expect(erd.edges.filter((edge: any) => edge.target === 'entity:order').map((edge: any) => edge.source).filter((source: string) => source.includes('tax') || source.includes('vat')).sort())
      .toEqual(['entity:sales-tax-receipt', 'entity:vat-invoice'])
  })

  it('never draws a Rule alternative as an unconditional prohibition', () => {
    const loaded = model(), base = loaded.businessRules[0]!
    loaded.businessRules.push({ ...base, id: 'conditional-denial', file: 'conditional-denial.md',
      appliesTo: [{ type: 'entity', id: 'source', effect: 'reads', facts: [], contexts: [] }], permits: []
    }, { ...base, id: 'conditional-access', file: 'conditional-access.md',
      appliesTo: [{ type: 'entity', id: 'source', effect: 'reads', facts: [], contexts: [] }],
      permits: [{ actors: ['reader'], related: [], when: [], unattended: true }]
    })
    withSet(loaded, 'configuration', 'business-rule', ['conditional-access', 'conditional-denial'])
    const workspace = projectReportWorkspace(compileReport(loaded, '2026-09-27'))
    const source = workspace.entities.find((item: any) => item.id === 'source')
    expect(source.prohibitions.some((item: any) => item.ruleId === 'conditional-denial')).toBe(false)
    expect(source.arcs.some((arc: any) => arc.forbiddenByRuleIds.includes('conditional-denial'))).toBe(false)
  })
})
