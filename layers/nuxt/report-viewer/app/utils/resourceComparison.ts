/** Named resource readings for Review. Only presentation is added to the saved reports. */
import { diffArrays } from 'diff'
import type { ProductReport, ReportReference } from 'businesslens/report'
import type { ReportResourceKind, ReportWorkspace } from './reportWorkspace'
import { COLLECTION_KIND } from './reportChanges'
import { reviewFileResource } from './reviewModel'
import { resourceConnectionRows } from './resourceConnections'

export interface ComparisonSide { report: ProductReport, workspace: ReportWorkspace, state: string }
export interface ComparisonNode {
  value: unknown
  identity?: string
  text?: string
  prose?: boolean
  resource?: string
  reference?: ReportReference
  fields?: ComparisonField[]
}
export interface ComparisonField {
  id: string
  label: string
  items: ComparisonNode[]
  list?: boolean
  ordered?: boolean
  itemLabel?: string
  derived?: boolean
  note?: string
}
export interface ComparisonReading { id: string, label: string, fields: ComparisonField[] }
export interface ComparisonRow<T> { before?: T, after?: T, beforeIndex?: number, afterIndex?: number, change: 'added' | 'deleted' | 'modified' | null }
type RecordValue = Record<string, unknown>
const record = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value)

/** Object-key order never makes an authored value look edited. Array order is preserved. */
export function comparisonFingerprint(value: unknown): string {
  return JSON.stringify(value, (_, item) => record(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item)
}

/** Stable names match named rows. Unnamed sequences anchor exact rows before pairing single edits.
 * No fuzzy matching or move inference: ambiguous runs are removed and added in full.
 */
export function comparisonRows<T>(before: T[], after: T[], value: (item: T) => unknown, identity?: (item: T) => string | undefined): ComparisonRow<T>[] {
  const fingerprint = (item: T) => comparisonFingerprint(value(item))
  const row = (bi: number | undefined, ai: number | undefined): ComparisonRow<T> => ({
    before: bi === undefined ? undefined : before[bi], after: ai === undefined ? undefined : after[ai], beforeIndex: bi, afterIndex: ai,
    change: bi === undefined ? 'added' : ai === undefined ? 'deleted' : fingerprint(before[bi]!) === fingerprint(after[ai]!) ? null : 'modified'
  })
  const left = before.map(item => identity?.(item)), right = after.map(item => identity?.(item))
  const keyed = [...left, ...right].every(Boolean) && new Set(left).size === left.length && new Set(right).size === right.length
  if (keyed) {
    // Names identify rows, but their order is still visible. A move remains an
    // addition/removal instead of silently disappearing or shifting every row.
    const result: ComparisonRow<T>[] = []
    let bi = 0, ai = 0
    const parts = diffArrays(left, right, { maxEditLength: 2000, timeout: 40 })
      ?? [{ value: left, removed: true, added: false }, { value: right, added: true, removed: false }]
    for (const part of parts) for (let i = 0; i < part.value.length; i++) {
      result.push(part.removed ? row(bi++, undefined) : part.added ? row(undefined, ai++) : row(bi++, ai++))
    }
    return result
  }
  const result: ComparisonRow<T>[] = []
  let bi = 0, ai = 0
  let removed: number[] = [], added: number[] = []
  const flush = () => {
    if (removed.length === 1 && added.length === 1) result.push(row(removed[0], added[0]))
    else { result.push(...removed.map(index => row(index, undefined)), ...added.map(index => row(undefined, index))) }
    removed = []; added = []
  }
  const parts = diffArrays(before.map(fingerprint), after.map(fingerprint), { maxEditLength: 2000, timeout: 40 })
    ?? [{ value: before.map(fingerprint), removed: true, added: false }, { value: after.map(fingerprint), added: true, removed: false }]
  for (const part of parts) {
    if (part.removed) for (let i = 0; i < part.value.length; i++) removed.push(bi++)
    else if (part.added) for (let i = 0; i < part.value.length; i++) added.push(ai++)
    else { flush(); for (let i = 0; i < part.value.length; i++) result.push(row(bi++, ai++)) }
  }
  flush()
  return result
}

const labels: Record<string, string> = {
  id: 'ID', title: 'Title', name: 'Name', summary: 'Summary', description: 'Description', intent: 'Intent',
  category: 'Category', tags: 'Tags', authors: 'Authors', license: 'License', url: 'URL', colorSlot: 'Color',
  limitations: 'Limitations', boundary: 'Boundary', type: 'Type', actorIds: 'Actors', actorId: 'Actor',
  entryPoints: 'Entry points', path: 'Path', capabilityBoundary: 'Capability boundary', interfaceIds: 'Interfaces',
  accessMode: 'Access mode', domainId: 'Domain', kind: 'Kind', acts: 'Acts', informationKept: 'Information kept',
  relations: 'Relationships', entityId: 'Entity', entityIds: 'Entities', verb: 'Relationship', cardinality: 'Cardinality',
  states: 'States', content: 'Definition', availability: 'Availability', placeId: 'Place', information: 'Information shown',
  actions: 'Actions', capabilityIds: 'Capabilities', capabilityScenarioIds: 'Capability Scenarios', journeyScenarioIds: 'Journey Scenarios',
  goal: 'Goal', successCriterion: 'Success criterion', failureOnlyCapabilityIds: 'Failure-only Capabilities', domainIds: 'Domains',
  capabilityId: 'Capability', journeyId: 'Journey', kindId: 'Scenario kind', routes: 'Routes', routeId: 'Route',
  text: 'Action / condition', steps: 'Steps', entities: 'Entity effects', as: 'Instance', effect: 'Effect', from: 'From state', to: 'To state',
  unattended: 'Unattended', contexts: 'Contexts', context: 'Context', trigger: 'Trigger', decisionPoints: 'Decision points',
  question: 'Question', branches: 'Branches', condition: 'Condition', outcome: 'Outcome', edgeCases: 'Edge cases', result: 'Result',
  statement: 'Rule statement', rationale: 'Rationale', appliesTo: 'Applies to', permits: 'Who may', facts: 'Facts',
  related: 'Related through', self: 'The actor itself', when: 'When (all conditions)', configuredByEntityId: 'Configured by',
  fact: 'Fact', state: 'State', operator: 'Operator', value: 'Value', scope: 'Scope', method: 'Method',
  covered: 'Covered', exclusions: 'Exclusions', unmapped: 'Unmapped', paths: 'Paths', references: 'References',
  role: 'Role', target: 'Target', supportingSections: 'Supporting context', heading: 'Heading'
}
const proseKeys = new Set(['summary', 'description', 'intent', 'boundary', 'capabilityBoundary', 'content', 'goal', 'successCriterion', 'trigger', 'question', 'outcome', 'statement', 'rationale', 'scope', 'method'])
const resourceKeys: Record<string, ReportResourceKind> = {
  actorId: 'entity', actorIds: 'entity', entityId: 'entity', entityIds: 'entity', configuredByEntityId: 'entity',
  domainId: 'domain', domainIds: 'domain', interfaceIds: 'interface', capabilityId: 'capability', capabilityIds: 'capability',
  failureOnlyCapabilityIds: 'capability', journeyId: 'journey', capabilityScenarioIds: 'capability-scenario', journeyScenarioIds: 'journey-scenario',
  ruleId: 'rule', ruleIds: 'rule', forbiddenByRuleIds: 'rule', scenarioIds: 'capability-scenario'
}
const label = (key: string) => labels[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, letter => letter.toUpperCase())

function node(value: unknown, key: string, side: ComparisonSide): ComparisonNode {
  if (record(value)) {
    const identity = ['id', 'name', 'title', 'heading'].find(key => typeof value[key] === 'string')
    const fields = Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined && entry !== '' && !(Array.isArray(entry) && !entry.length)).map(([field, entry]) => fieldOf(field, entry, side))
    // A Rule's resource target has a type and an id, unlike Context and Entity targets.
    if (key === 'appliesTo' && typeof value.id === 'string' && typeof value.type === 'string') {
      const target = fields.find(field => field.id === 'id')!
      target.label = 'Resource'
      target.items = [linked(value.id, value.type as ReportResourceKind, side)]
    }
    return { value, identity: identity ? String(value[identity]) : undefined, fields,
      reference: key === 'references' ? value as unknown as ReportReference : undefined }
  }
  if (resourceKeys[key] && typeof value === 'string') return linked(value, resourceKeys[key], side)
  if (key === 'placeId' && typeof value === 'string') {
    const place = ['screen', 'experience', 'interface'].map(kind => side.workspace.byKey.get(`${kind}:${value}`)).find(Boolean)
    return { value, text: place?.title ?? value, resource: place?.key }
  }
  if (key === 'kindId' && typeof value === 'string') return { value, text: side.workspace.scenarioKinds.find(kind => kind.id === value)?.name ?? value }
  const text = value === null || value === undefined ? 'Not recorded.' : value === '' ? 'Not recorded.' : typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value)
  return { value, text, prose: proseKeys.has(key), identity: typeof value === 'string' ? value : undefined }
}
function linked(id: string, kind: ReportResourceKind, side: ComparisonSide): ComparisonNode {
  const resource = side.workspace.byKey.get(`${kind}:${id}`)
  return { value: id, identity: id, text: resource?.title ?? id, resource: resource?.key }
}
function fieldOf(key: string, value: unknown, side: ComparisonSide, options: Partial<ComparisonField> = {}): ComparisonField {
  // Keep structured Markdown intact; ordinary paragraphs can retain unchanged context individually.
  const paragraphs = proseKeys.has(key) && typeof value === 'string' && !/^\s*(?:```|~~~|\||[-*+]\s|\d+[.)]\s)/m.test(value)
    ? value.split(/\n\s*\n/).filter(Boolean) : null
  const items = (Array.isArray(value) ? value : paragraphs?.length ? paragraphs : [value]).map(item => node(item, key, side))
  if (!items.length && key === 'permits') items.push({ value: [], text: 'Nobody may perform the selected operation.' })
  if (key === 'permits' && value === null) items[0] = { value: null, text: 'No authorization claim.' }
  return { id: key, label: label(key), items, list: Array.isArray(value), ordered: !!paragraphs || ['steps', 'entryPoints', 'decisionPoints', 'branches', 'permits'].includes(key),
    itemLabel: key === 'steps' ? 'Step' : key === 'permits' && Array.isArray(value) && value.length ? 'Grant' : undefined,
    note: key === 'permits' && Array.isArray(value) && value.length ? 'Any one grant permits it. Every condition within a grant must hold, and every Rule selecting this operation must also permit it.' : undefined,
    ...options }
}

/** Explicit field placement, shared by additions, edits and deletions for all ten kinds. */
export const resourceOverviewFields: Record<Exclude<ReportResourceKind, 'product'>, string[]> = {
  domain: ['id', 'name', 'description', 'boundary', 'colorSlot', 'intent'],
  entity: ['id', 'title', 'description', 'domainId', 'kind', 'acts', 'intent', 'informationKept'],
  interface: ['id', 'title', 'description', 'type', 'actorIds', 'entryPoints', 'capabilityBoundary', 'intent'],
  experience: ['id', 'title', 'description', 'interfaceIds', 'actorIds', 'accessMode', 'entryPoints', 'capabilityBoundary', 'intent'],
  screen: ['id', 'title', 'description', 'intent', 'entityIds', 'information', 'actions', 'states', 'entryPoints', 'capabilityBoundary'],
  capability: ['id', 'title', 'description', 'intent', 'domainId', 'availability'],
  journey: ['id', 'title', 'goal', 'intent', 'successCriterion', 'actorIds'],
  'capability-scenario': ['id', 'title', 'capabilityId', 'kindId', 'intent', 'trigger', 'routes', 'steps', 'decisionPoints', 'outcome', 'edgeCases'],
  'journey-scenario': ['id', 'title', 'journeyId', 'kindId', 'result', 'intent', 'trigger', 'routes', 'steps', 'decisionPoints', 'outcome', 'edgeCases'],
  rule: ['id', 'title', 'statement', 'rationale', 'intent', 'appliesTo', 'permits']
}

export function comparisonResource(side: ComparisonSide, key: string): RecordValue | undefined {
  if (key === 'product') return side.report as unknown as RecordValue
  if (key === 'coverage') return side.report.coverage as unknown as RecordValue
  for (const [collection, kind] of Object.entries(COLLECTION_KIND)) {
    if (!key.startsWith(`${kind}:`)) continue
    const resources = side.report.model[collection as keyof typeof COLLECTION_KIND]
    return resources.find(resource => resource.id === key.slice(kind.length + 1)) as unknown as RecordValue | undefined
  }
}

export function comparisonFileKey(side: ComparisonSide | null, modelPath: string, path: string): string | null {
  if (!side) return null
  const local = path.slice(modelPath.length + 1)
  if (path.startsWith(`${modelPath}/`) && ['product.md', 'product/product.md'].includes(local)) return 'product'
  if (path === `${modelPath}/coverage.md`) return 'coverage'
  return reviewFileResource(side.workspace, modelPath, path)?.key ?? null
}

export function comparisonReadings(side: ComparisonSide | null, key: string): ComparisonReading[] {
  if (!side) return []
  const source = comparisonResource(side, key)
  if (!source) return []
  const fields = (names: string[]) => names.filter(name => Object.hasOwn(source, name)).map(name => fieldOf(name, source[name], side))
  const supporting = () => (source.supportingSections as Array<{ heading: string, content: string }> ?? []).map(section => ({
    id: `supporting:${section.heading}`, label: section.heading, items: [node(section.content, 'content', side)]
  }))
  if (key === 'coverage') return [{ id: 'coverage', label: 'Coverage', fields: fields(['scope', 'method', 'covered', 'exclusions', 'unmapped', 'limitations']) }]
  if (key === 'product') return [
    { id: 'overview', label: 'About', fields: [...fields(['id', 'title', 'summary', 'description', 'intent', 'limitations', 'category', 'tags', 'authors', 'license']), ...supporting()] },
    ...comparisonReadings(side, 'coverage'),
    { id: 'references', label: 'References', fields: fields(['references']) }
  ]
  const resource = side.workspace.byKey.get(key)!
  const kind = resource.kind
  const readings: ComparisonReading[] = [{ id: 'overview', label: 'Overview', fields: [...fields(resourceOverviewFields[kind]), ...supporting()] }]
  if (kind === 'capability-scenario' || kind === 'journey-scenario') readings[0]!.fields.push(...fields(['actorIds']).map(field => ({ ...field, derived: true })))
  if (kind === 'screen') {
    const states = readings[0]!.fields.find(field => field.id === 'states')
    if (states) states.label = 'View states'
  }
  if (kind === 'entity') {
    if (resource.states.length || resource.arcs.length || resource.prohibitions.length) readings.push({ id: 'lifecycle', label: 'Lifecycle', fields: [
      ...fields(['states']),
      fieldOf('transitions', resource.arcs.map(arc => ({ effect: arc.effect, from: arc.from, to: arc.to,
        capabilityScenarioIds: arc.capabilityScenarioIds, journeyScenarioIds: arc.journeyScenarioIds,
        ruleIds: arc.ruleIds, forbiddenByRuleIds: arc.forbiddenByRuleIds, coEffects: arc.coEffects })), side, { label: 'Transitions', derived: true }),
      fieldOf('prohibitions', resource.prohibitions, side, { label: 'Prohibitions', derived: true })
    ] })
  }
  if (kind === 'capability' || kind === 'journey') {
    const children = kind === 'capability' ? side.workspace.scenariosByCapability.get(resource.id) : side.workspace.scenariosByJourney.get(resource.id)
    readings.push({ id: 'scenarios', label: 'Scenarios', fields: (children ?? []).map(child => ({
      id: child.key, label: child.title, items: [{ value: comparisonResource(side, child.key), identity: child.key,
        resource: child.key, text: child.title, fields: comparisonReadings(side, child.key).find(reading => reading.id === 'overview')!.fields }]
    })) })
    if (kind === 'capability') readings[0]!.fields.push(fieldOf('effects', resource.entityEffects, side, { label: 'What it changes', derived: true }))
    else readings[0]!.fields.push(fieldOf('leavesBehind', resource.leavesBehind, side, { label: 'Leaves behind', derived: true }))
  }
  // Authored relation fields which live outside Overview retain their exact values.
  const authoredConnections = fields(['relations', 'capabilityIds', 'capabilityScenarioIds', 'journeyScenarioIds', 'failureOnlyCapabilityIds', 'domainIds'])
  if (kind === 'journey') authoredConnections.forEach(field => { field.derived = true })
  const derivedConnections = resourceConnectionRows(side.workspace, resource).filter(row => row.derived).map(row => ({
    id: `${row.direction}:${row.label}`, label: `${row.label} · ${row.direction.toLowerCase()}`, derived: true, list: true,
    items: row.ids.map(id => linked(id, row.kind, side))
  }))
  if (authoredConnections.length || derivedConnections.length) readings.push({ id: 'connections', label: 'Connections', fields: [...authoredConnections, ...derivedConnections] })
  if (resource.references.length) readings.push({ id: 'references', label: 'References', fields: fields(['references']) })
  return readings
}

export function pairedFields(before: ComparisonField[], after: ComparisonField[]) {
  return comparisonRows(before, after, field => field.items.map(item => item.value), field => field.id)
}
export function readingChanged(before?: ComparisonReading, after?: ComparisonReading): boolean {
  return pairedFields(before?.fields ?? [], after?.fields ?? []).some(row => !!row.change)
}
