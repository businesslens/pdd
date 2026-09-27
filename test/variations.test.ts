import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { lintModel } from '../src/commands/lint.js'
import { expandProductReport } from '../src/commands/open.js'
import { loadModel, type VariationResource } from '../src/core/model.js'
import { ProductReportV15Schema, projectPortableReport, validateProductReport } from '../src/core/portable.js'
import { VARIATION_COLLECTIONS, VARIATION_KINDS, type VariationFields, type VariationUsage } from '../src/core/variations.js'

const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const { projectReportWorkspace } = await utility('reportWorkspace')
const { variationsOf, variationMembers } = await utility('variations')
const { resourceConnectionRows } = await utility('resourceConnections')
const { tabsFor } = await utility('pageSections')
const { structureChildren, insideSummary } = await utility('collectionChildren')
const ROOT = join(__dirname, '..', 'blueprints/content-feed-reader')
const ANCHOR = 'reader-mobile::personal-library'
const VARIANT = 'reader-mobile::source-focused-library'
const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })
const model = () => loadModel(ROOT)
const report = () => compileReport(model(), '2026-09-26')
const temporary = () => { const dir = mkdtempSync(join(tmpdir(), 'bl-variations-')); dirs.push(dir); return dir }
function setVariation(resource: VariationResource, fields: Partial<VariationFields>) {
  Object.assign(resource, fields)
}
function usageFor(kind: string, selectedWhen = 'Standard'): VariationUsage {
  const base = { selectedWhen, takesEffect: 'At session start.', stability: 'Fixed until the session ends.' }
  if (kind === 'experiment') return { ...base, assignmentUnit: { entity: 'reader' }, assignmentMethod: 'Assigned randomly per Reader.', assignmentFact: { entity: 'reader', fact: 'Library assignment' }, allocation: 'Half of eligible Readers.' }
  if (kind === 'version') return { ...base, label: selectedWhen, discriminator: { entity: 'reader', fact: 'Library assignment' } }
  return { ...base, settings: [{ entity: 'reader', fact: 'Library assignment' }] }
}

const cases = VARIATION_COLLECTIONS.flatMap(collection => VARIATION_KINDS.map(kind => ({ collection, kind })))
describe('resource Variations', () => {
  it.each(cases)('round-trips $kind on $collection with its own applicability and no inherited content', ({ collection, kind }) => {
    const loaded = model()
    for (const key of VARIATION_COLLECTIONS) for (const resource of loaded[key]) {
      setVariation(resource, { variantOf: null, variationKind: null, variationUsage: null })
    }
    const [anchor, peer] = loaded[collection]
    setVariation(anchor!, { variationKind: kind, variationUsage: usageFor(kind, 'Standard') })
    setVariation(peer!, { variantOf: anchor!.id, variationUsage: usageFor(kind, 'Guided') })
    expect(lintModel(loaded, []).errors).toEqual([])
    const original = compileReport(loaded, '2026-09-26')
    expect(validateProductReport(original)).toEqual([])
    const wirePeer = original.model[collection].find(item => item.id === peer!.id)!
    expect(wirePeer.variationKind).toBeNull()
    expect(wirePeer.variationUsage).toEqual(peer!.variationUsage)
    expect(wirePeer.supportingSections.some(item => item.heading === 'When used')).toBe(false)
    const portable = projectPortableReport(original)
    expect(portable.model[collection]).toEqual(original.model[collection].map(item => ({ ...item, references: portable.model[collection].find(other => other.id === item.id)!.references })))
    const target = temporary()
    expandProductReport(target, portable, false)
    const reopened = loadModel(target)
    expect(lintModel(reopened, []).errors).toEqual([])
    const again = compileReport(reopened, '2026-09-26')
    expect(again.model[collection]).toEqual(portable.model[collection])
    const workspace = projectReportWorkspace(original)
    const viewKind = { interfaces: 'interface', experiences: 'experience', screens: 'screen', entities: 'entity', capabilities: 'capability', journeys: 'journey', businessRules: 'rule' }[collection]
    const a = workspace.byKey.get(`${viewKind}:${anchor!.id}`), b = workspace.byKey.get(`${viewKind}:${peer!.id}`)
    expect(b.variation).toEqual({ kind, anchorId: anchor!.id, usage: peer!.variationUsage })
    expect(variationsOf(workspace, a).map((item: any) => item.key)).toEqual([b.key])
    expect(variationsOf(workspace, b).map((item: any) => item.key)).toEqual([a.key])
    for (const resource of [a, b]) {
      const tabs = tabsFor(workspace, resource)
      expect(tabs[0].blocks).toContain('when-used')
      expect(tabs[0].blocks).not.toContain('variants')
      expect(tabs.find((tab: any) => tab.id === 'variations')).toEqual({ id: 'variations', label: 'Variations', count: 2, blocks: ['variants'] })
      expect(tabs.findIndex((tab: any) => tab.id === 'variations')).toBeLessThan(tabs.findIndex((tab: any) => tab.id === 'connections'))
      expect(resourceConnectionRows(workspace, resource).some((row: any) => row.label === 'variation of')).toBe(true)
    }
  })


  it('keeps five members in the same order from every reading and counts the current member once', () => {
    const workspace = projectReportWorkspace(report())
    const anchor = workspace.byKey.get(`experience:${ANCHOR}`)!
    for (const [id, title] of [['compact', 'Compact library'], ['guided', 'Guided library'], ['compact-b', 'Compact library']]) {
      const member = { ...anchor, id: `reader-mobile::${id}`, key: `experience:reader-mobile::${id}`, title }
      workspace.byKey.set(member.key, member)
    }
    const members = variationMembers(workspace, anchor)
    expect(members.map((member: any) => member.id)).toEqual([
      'reader-mobile::compact', 'reader-mobile::compact-b', 'reader-mobile::guided', ANCHOR, VARIANT
    ])
    workspace.byKey = new Map([...workspace.byKey].reverse())
    for (const member of members) {
      expect(variationMembers(workspace, member).map((item: any) => item.key)).toEqual(members.map((item: any) => item.key))
      expect(variationsOf(workspace, member)).toHaveLength(4)
      expect(tabsFor(workspace, member).find((tab: any) => tab.id === 'variations')?.count).toBe(5)
    }
    const unrelated = workspace.interfaces[0]
    expect(variationMembers(workspace, unrelated)).toEqual([])
    expect(tabsFor(workspace, unrelated).some((tab: any) => tab.id === 'variations')).toBe(false)
  })

  it.each([
    ['', 'full resource id'], ['personal-library', 'missing resource of the same type'],
    ['reader-mobile::missing', 'missing resource of the same type'],
    [VARIANT, 'cannot name itself'], ['reader-mobile::personal-library::unread-library', 'missing resource of the same type']
  ])('rejects invalid target %s in folder and wire', (target, message) => {
    const loaded = model()
    loaded.experiences.find(e => e.id === VARIANT)!.variantOf = target
    expect(lintModel(loaded, []).errors.join('\n')).toContain(message)
    const wire = report()
    wire.model.experiences.find(e => e.id === VARIANT)!.variantOfId = target
    if (ProductReportV15Schema.safeParse(wire).success) expect(validateProductReport(wire).join('\n')).toContain(message)
    else expect(validateProductReport(wire).length).toBeGreaterThan(0)
  })

  it.each([
    ['missing subtype', 'anchor', { variationKind: null }, 'anchor needs variationKind'],
    ['unknown subtype', 'anchor', { variationKind: 'rollout' }, 'variationKind must be'],
    ['prototype subtype', 'anchor', { variationKind: 'constructor' }, 'variationKind must be'],
    ['repeated subtype', 'peer', { variationKind: 'configuration' }, 'belongs only on the anchor'],
    ['conflicting subtype', 'peer', { variationKind: 'version' }, 'belongs only on the anchor'],
    ['missing applicability', 'anchor', { variationUsage: null }, 'needs variationUsage'],
    ['empty applicability', 'peer', { variationUsage: { selectedWhen: '  ', takesEffect: '', stability: '' } }, 'variationUsage.selectedWhen']
  ] as const)('rejects %s', (_name, member, fields, message) => {
    const loaded = model(), id = member === 'anchor' ? ANCHOR : VARIANT
    Object.assign(loaded.experiences.find(e => e.id === id)!, fields)
    expect(lintModel(loaded, []).errors.join('\n')).toContain(message)
    const wire = report()
    Object.assign(wire.model.experiences.find(e => e.id === id)!, fields)
    expect(validateProductReport(wire).length).toBeGreaterThan(0)
  })

  it('rejects chains, cycles and orphan metadata', () => {
    const loaded = model()
    loaded.experiences.push({ ...loaded.experiences.find(e => e.id === VARIANT)!, id: 'reader-mobile::third', variantOf: VARIANT })
    expect(lintModel(loaded, []).errors.join('\n')).toContain('chain or cycle')
    const wire = report()
    wire.model.experiences.find(e => e.id === ANCHOR)!.variantOfId = VARIANT
    expect(validateProductReport(wire).join('\n')).toContain('chain or cycle')
    const orphan = report()
    orphan.model.experiences.find(e => e.id === VARIANT)!.variantOfId = null
    expect(validateProductReport(orphan).join('\n')).toContain('incoming variantOf link')
    expect(validateProductReport(orphan).join('\n')).toContain('only allowed on a member')
  })

  it('requires all three nullable fields on the wire and rejects unsupported types/hidden applicability', () => {
    for (const field of ['variantOfId', 'variationKind', 'variationUsage'] as const) {
      const wire = report()
      delete (wire.model.entities[0]! as Partial<typeof wire.model.entities[number]>)[field]
      expect(ProductReportV15Schema.safeParse(wire).success).toBe(false)
    }
    for (const collection of ['domains', 'capabilityScenarios', 'journeyScenarios'] as const) {
      const wire = report()
      Object.assign(wire.model[collection][0]!, { variationKind: 'version' })
      expect(ProductReportV15Schema.safeParse(wire).success).toBe(false)
    }
    for (const collection of ['domains', 'capabilityScenarios', 'entities', 'businessRules'] as const) {
      const wire = report()
      wire.model[collection][0]!.supportingSections.push({ heading: 'When used', content: 'Always.' })
      expect(validateProductReport(wire).join('\n')).toContain('conflicts with a structured section')
    }
    const removed = report()
    Object.assign(removed.model.experiences[0]!, { whenUsed: 'Old prose.' })
    expect(ProductReportV15Schema.safeParse(removed).success).toBe(false)
    const wire = report()
    Object.assign(wire, { variationKind: 'version' })
    expect(ProductReportV15Schema.safeParse(wire).success).toBe(false)
  })

  it('rejects removed When used sections and variation fields on unsupported authored types', () => {
    const target = temporary()
    expandProductReport(target, report(), false)
    const loaded = loadModel(target)
    const anchor = loaded.experiences.find(e => e.id === ANCHOR)!
    writeFileSync(anchor.file, readFileSync(anchor.file, 'utf8') + '\n## When used\n\nAnother condition.\n')
    expect(lintModel(loadModel(target), []).errors.join('\n')).toContain('"## When used" is not allowed')
    const domain = loaded.domains[0]!
    writeFileSync(domain.file, readFileSync(domain.file, 'utf8').replace('---', '---\nvariationKind: configuration') + '\n## When used\n\nAlways.\n')
    const invalid = lintModel(loadModel(target), []).errors.join('\n')
    expect(invalid).toContain('variationKind')
    expect(invalid).toContain('"## When used" is not allowed')
  })


  it.each([
    ['missing setting Entity', 'configuration', { settings: [{ entity: 'missing', fact: 'Library assignment' }] }, 'missing Entity'],
    ['missing setting fact', 'configuration', { settings: [{ entity: 'reader', fact: 'Missing fact' }] }, 'missing fact'],
    ['duplicate settings', 'configuration', { settings: [{ entity: 'reader', fact: 'Library assignment' }, { entity: 'reader', fact: 'Library assignment' }] }, 'repeats fact'],
    ['wrong subtype fields', 'configuration', { label: 'v2' }, 'variationUsage'],
    ['missing assignment Entity', 'experiment', { assignmentUnit: { entity: 'missing' } }, 'missing Entity'],
    ['missing assignment fact', 'experiment', { assignmentFact: { entity: 'reader', fact: 'Missing fact' } }, 'missing fact'],
    ['missing version discriminator', 'version', { discriminator: { entity: 'missing', fact: 'Version' } }, 'missing Entity'],
    ['duplicate version labels', 'version', { label: 'STANDARD' }, 'must be unique']
  ])('rejects %s in authored models and reports', (_name, kind, fields, message) => {
    const loaded = model()
    const a = loaded.experiences.find(item => item.id === ANCHOR)!, b = loaded.experiences.find(item => item.id === VARIANT)!
    setVariation(a, { variationKind: kind, variationUsage: usageFor(kind, 'Standard') })
    setVariation(b, { variationUsage: { ...usageFor(kind, 'Guided'), ...fields } as VariationUsage })
    expect(lintModel(loaded, []).errors.join('\n')).toContain(message)
    const wire = report()
    wire.model.experiences.find(item => item.id === ANCHOR)!.variationKind = kind as 'configuration' | 'experiment' | 'version'
    wire.model.experiences.find(item => item.id === ANCHOR)!.variationUsage = a.variationUsage
    wire.model.experiences.find(item => item.id === VARIANT)!.variationUsage = b.variationUsage
    expect(validateProductReport(wire).join('\n')).toContain(message)
  })

  it('supports unmodeled assignment units and selection without invented facts', () => {
    for (const kind of ['experiment', 'configuration', 'version']) {
      const loaded = model()
      const a = loaded.experiences.find(item => item.id === ANCHOR)!, b = loaded.experiences.find(item => item.id === VARIANT)!
      const base = { selectedWhen: 'Eligible requests.', takesEffect: 'On each request.', stability: 'For that request only.' }
      const usage = kind === 'experiment' ? { ...base, assignmentUnit: { description: 'A browser session.' }, assignmentMethod: 'Assigned randomly.' }
        : kind === 'version' ? { ...base, label: 'v1' } : base
      setVariation(a, { variationKind: kind, variationUsage: usage })
      setVariation(b, { variationUsage: kind === 'version' ? { ...base, label: 'v2' } : usage })
      expect(lintModel(loaded, []).errors).toEqual([])
      const wire = compileReport(loaded, '2026-09-27')
      expect(validateProductReport(wire)).toEqual([])
      const target = temporary()
      expandProductReport(target, wire, false)
      expect(loadModel(target).experiences.find(item => item.id === ANCHOR)!.variationUsage).toEqual(usage)
    }
  })

  it('rejects malformed authored usage rather than retaining it as prose', () => {
    const target = temporary()
    expandProductReport(target, report(), false)
    const file = loadModel(target).experiences.find(item => item.id === ANCHOR)!.file
    const original = readFileSync(file, 'utf8')
    writeFileSync(file, original.replace('variationUsage:', 'variationUsage: false\nunusedUsage:'))
    expect(lintModel(loadModel(target), []).errors.join('\n')).toContain('invalid variationUsage')
  })

  it('counts an Entity used only as a selection fact source as meaningful use', () => {
    const loaded = model()
    const template = loaded.entities.find(item => item.id === 'reader')!
    loaded.entities.push({ ...template, id: 'selection-settings', file: 'selection-settings.md', acts: undefined, kind: undefined, relations: [], states: [] })
    loaded.experiences.find(item => item.id === ANCHOR)!.variationUsage = {
      ...usageFor('configuration'), settings: [{ entity: 'selection-settings', fact: 'Library assignment' }]
    }
    expect(lintModel(loaded, []).errors).toEqual([])
    expect(validateProductReport(compileReport(loaded, '2026-09-27'))).toEqual([])
  })

  it('exposes typed selection references in both directions even when the Entity is also an Actor', () => {
    const workspace = projectReportWorkspace(report())
    const experience = workspace.byKey.get(`experience:${ANCHOR}`)
    expect(resourceConnectionRows(workspace, experience).some((row: any) => row.label === 'variation setting: Library assignment' && row.ids.includes('reader'))).toBe(true)
    expect(resourceConnectionRows(workspace, workspace.byKey.get('entity:reader')).some((row: any) => row.label === 'variation setting: Library assignment' && row.ids.includes(ANCHOR))).toBe(true)
  })

  it('keeps containment counts independent of variation peers', () => {
    const workspace = projectReportWorkspace(report())
    const iface = workspace.interfaces.find((item: any) => item.id === 'reader-mobile')
    const group = structureChildren(workspace, iface).find((node: any) => node.groupKind === 'experience')
    expect(group.children.map((node: any) => node.resource.id)).toEqual([ANCHOR, VARIANT])
    for (const node of group.children) {
      expect(node.children.some((child: any) => child.resource?.kind === 'experience')).toBe(false)
      expect(insideSummary(node).some((count: any) => count.kind === 'experience')).toBe(false)
    }
  })

  it('does not enforce or draw conditional permission alternatives as unconditional prohibitions', () => {
    const loaded = model(), base = loaded.businessRules[0]!
    loaded.businessRules.push({ ...base, id: 'conditional-denial', file: 'conditional-denial.md',
      appliesTo: [{ type: 'entity', id: 'source', effect: 'reads', facts: [], contexts: [] }], permits: [],
      variantOf: null, variationKind: 'configuration', variationUsage: usageFor('configuration', 'When the account is suspended.')
    }, { ...base, id: 'conditional-access', file: 'conditional-access.md',
      appliesTo: [{ type: 'entity', id: 'source', effect: 'reads', facts: [], contexts: [] }],
      permits: [{ actors: ['reader'], related: [], when: [], unattended: true }],
      variantOf: 'conditional-denial', variationKind: null, variationUsage: usageFor('configuration', 'When the account is active.')
    })
    const result = lintModel(loaded, [])
    expect(result.errors).toEqual([])
    expect(result.warnings.filter(item => item.includes('permission applicability'))).toHaveLength(2)
    const wire = compileReport(loaded, '2026-09-26')
    expect(validateProductReport(wire)).toEqual([])
    const workspace = projectReportWorkspace(wire)
    expect(workspace.entities.find((item: any) => item.id === 'source').prohibitions.some((item: any) => item.ruleId === 'conditional-denial')).toBe(false)
    expect(workspace.rules.find((item: any) => item.id === 'conditional-denial').variation.usage.selectedWhen).toContain('suspended')
    // Removing applicability restores ordinary unconditional prohibition checks.
    for (const rule of loaded.businessRules.filter(item => item.id.startsWith('conditional-'))) setVariation(rule, { variantOf: null, variationKind: null, variationUsage: null })
    expect(lintModel(loaded, []).errors.join('\n')).toContain('forbids')
    expect(() => compileReport(loaded, '2026-09-26')).toThrow('forbids')
  })
})
