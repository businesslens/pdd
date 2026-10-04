import type { AnyResourceView, ReportWorkspace, VariationKind, VariationSetView } from './reportWorkspace'
import { resourceAncestors } from './reportDestinations'

export const VARIATION_LABELS: Record<VariationKind, string> = {
  experiment: 'Experiment', configuration: 'Configuration', version: 'Version'
}

/** The set an alternative belongs to, or the set itself. */
export function variationSetOf(workspace: ReportWorkspace, resource: AnyResourceView): VariationSetView | undefined {
  if (resource.kind === 'variation') return resource
  const set = resource.variation ? workspace.byKey.get(resource.variation.key) : undefined
  return set?.kind === 'variation' ? set : undefined
}

/** A set's alternatives by title, then key: authored order carries no meaning. */
export function variationAlternatives(workspace: ReportWorkspace, set: VariationSetView): AnyResourceView[] {
  return set.alternatives
    .flatMap(item => { const resource = workspace.byKey.get(item.key); return resource ? [resource] : [] })
    .sort((a, b) => a.title.localeCompare(b.title, 'en') || a.key.localeCompare(b.key, 'en'))
}

/**
 * The resource a title line names: an alternative is titled by its Variation,
 * and the picker beside the title names the alternative. Everything else names
 * itself.
 */
export function titledBy(workspace: ReportWorkspace, resource: AnyResourceView): AnyResourceView {
  return resource.kind === 'variation' ? resource : variationSetOf(workspace, resource) ?? resource
}

/** What the picker beside a set's title says: the alternative being read, a Version's label, or the set's size. */
export function variationPickerLabel(workspace: ReportWorkspace, resource: AnyResourceView): string | undefined {
  if (resource.kind === 'variation') {
    const count = resource.alternatives.length
    return `${count} ${count === 1 ? 'alternative' : 'alternatives'}`
  }
  if (!resource.variation || !variationSetOf(workspace, resource)) return undefined
  return resource.variation.label ?? resource.title
}

/**
 * One row per set wherever two or more of its alternatives meet in a list.
 *
 * The set takes the place of its first alternative; a lone alternative keeps
 * its own row and carries its set on its title. Counts stay concrete: callers
 * count the resources they passed, not the rows this returns.
 */
export function collapseVariations(workspace: ReportWorkspace, resources: readonly AnyResourceView[]): AnyResourceView[] {
  const together = new Map<string, number>()
  for (const resource of resources) {
    if (resource.variation) together.set(resource.variation.key, (together.get(resource.variation.key) ?? 0) + 1)
  }
  const placed = new Set<string>()
  return resources.flatMap((resource) => {
    const key = resource.variation?.key
    if (!key || (together.get(key) ?? 0) < 2) return [resource]
    if (placed.has(key)) return []
    placed.add(key)
    const set = workspace.byKey.get(key)
    return set ? [set] : [resource]
  })
}

/**
 * A list of sets, with each Scenario set under the Capability or Journey its
 * alternatives share. A Scenario is never read without its owner, and `lint`
 * keeps a Scenario set's alternatives under one, so the owner is always known.
 * Other sets keep their place, ahead of any owner; owners order by title.
 */
export function variationsByOwner(workspace: ReportWorkspace, resources: readonly AnyResourceView[]): Array<{ owner?: AnyResourceView, resources: AnyResourceView[] }> {
  const loose: AnyResourceView[] = []
  const owned = new Map<string, { owner: AnyResourceView, resources: AnyResourceView[] }>()
  for (const resource of resources) {
    const scenarios = resource.kind === 'variation' && (resource.memberKind === 'capability-scenario' || resource.memberKind === 'journey-scenario')
    const owner = scenarios ? resourceAncestors(workspace, resource).at(-1) : undefined
    if (!owner) { loose.push(resource); continue }
    const entry = owned.get(owner.key) ?? { owner, resources: [] }
    entry.resources.push(resource)
    owned.set(owner.key, entry)
  }
  const owners = [...owned.values()].sort((a, b) => a.owner.title.localeCompare(b.owner.title, 'en') || a.owner.key.localeCompare(b.owner.key, 'en'))
  return [...(loose.length ? [{ resources: loose }] : []), ...owners]
}

/** Typed selection references a set chooses by, never availability or permission. */
export function variationSelectionReferences(set: VariationSetView): { label: string, entity: string, fact?: string }[] {
  const result: { label: string, entity: string, fact?: string }[] = []
  if (set.assignmentUnit && 'entity' in set.assignmentUnit) result.push({ label: 'Assignment unit', entity: set.assignmentUnit.entity })
  if (set.assignmentFact) result.push({ label: 'Assignment fact', ...set.assignmentFact })
  for (const setting of set.settings) result.push({ label: 'Setting', ...setting })
  if (set.discriminator) result.push({ label: 'Version discriminator', ...set.discriminator })
  return result
}

/** A one-line account of what chooses between the alternatives, for rows and menus. */
export function variationChooser(workspace: ReportWorkspace, set: VariationSetView): { label: string, text: string } | undefined {
  const title = (id: string) => workspace.byKey.get(`entity:${id}`)?.title ?? id
  if (set.variationKind === 'experiment') {
    const unit = set.assignmentUnit
    const who = unit && 'entity' in unit ? title(unit.entity) : unit?.description
    return who ? { label: 'Assigned per', text: [who, set.allocation].filter(Boolean).join(' · ') } : undefined
  }
  const refs = variationSelectionReferences(set)
  if (!refs.length) return undefined
  return {
    label: set.variationKind === 'version' ? 'Discriminator' : 'Chosen by',
    text: refs.map(ref => ref.fact ? `${title(ref.entity)} · ${ref.fact}` : title(ref.entity)).join(', ')
  }
}

/** One alternative a thing happens under: the set, and the alternative chosen in it. */
export interface VariationChoice { set: VariationSetView, alternative: AnyResourceView }

/**
 * The alternatives a resource runs or sits under. A resource that is an
 * alternative runs only when chosen; so does everything inside one — a
 * Scenario of a Capability or Journey that is an alternative, a Screen inside
 * an Experience that is one. Each set appears once.
 */
export function variationChoicesOf(workspace: ReportWorkspace, resource: AnyResourceView): VariationChoice[] {
  const found = new Map<string, VariationChoice>()
  const add = (item: AnyResourceView | undefined) => {
    const set = item ? variationSetOf(workspace, item) : undefined
    if (item && set && item.kind !== 'variation' && !found.has(set.key)) found.set(set.key, { set, alternative: item })
  }
  add(resource)
  for (const ancestor of resourceAncestors(workspace, resource)) add(ancestor)
  return [...found.values()]
}

/** How a group of choices reads: "Cancellation handling: Order cancellation", joined. */
export function variationChoiceLabel(choices: readonly VariationChoice[]): string {
  return choices.map(choice => `${choice.set.title}: ${choice.alternative.variation?.label ?? choice.alternative.title}`).join(' · ')
}

export interface VariationCondition<T extends AnyResourceView> {
  /** True when some choice of alternatives leaves nothing behind it. */
  conditional: boolean
  /** The supporters grouped by what they need: what always holds first (`choices` empty), then by alternative. */
  groups: Array<{ key: string, choices: VariationChoice[], resources: T[] }>
}

/**
 * Whether something holds whatever is chosen, read from what supports it — the
 * Scenarios making a change, the places delivering a Capability. It holds
 * unconditionally when one supporter needs no choice, or when supporters that
 * each need only one alternative of the same set cover every alternative of it.
 * Otherwise some choice leaves it with nothing, and it is conditional. A set the
 * surface already reads under — a row's or column's own Variation, an Entity's
 * own — is passed in `known` and never counted.
 */
export function variationCondition<T extends AnyResourceView>(workspace: ReportWorkspace, supporters: readonly T[], known: ReadonlySet<string> = new Set()): VariationCondition<T> {
  const needs = supporters.map(resource => ({ resource, choices: variationChoicesOf(workspace, resource).filter(choice => !known.has(choice.set.key)) }))
  const groups = new Map<string, { key: string, choices: VariationChoice[], resources: T[] }>()
  for (const { resource, choices } of needs) {
    const key = choices.map(choice => choice.alternative.key).sort().join('+')
    const group = groups.get(key) ?? { key, choices, resources: [] }
    if (!group.resources.includes(resource)) group.resources.push(resource)
    groups.set(key, group)
  }
  const always = needs.some(item => !item.choices.length)
  const covered = new Map<string, Set<string>>()
  for (const { choices } of needs) {
    if (choices.length !== 1) continue
    const [choice] = choices
    covered.set(choice!.set.key, (covered.get(choice!.set.key) ?? new Set()).add(choice!.alternative.key))
  }
  const either = [...covered].some(([key, alternatives]) => {
    const set = workspace.byKey.get(key)
    return set?.kind === 'variation' && set.alternatives.every(item => alternatives.has(item.key))
  })
  const ordered = [...groups.values()].sort((a, b) => a.choices.length - b.choices.length || variationChoiceLabel(a.choices).localeCompare(variationChoiceLabel(b.choices), 'en'))
  return { conditional: supporters.length > 0 && !always && !either, groups: ordered }
}

/** What a conditional thing says about when it holds: its one set of alternatives, or that it takes some. */
export function variationConditionNote(conditions: readonly VariationCondition<AnyResourceView>[]): string {
  const labels = new Set(conditions.flatMap(condition => condition.groups.map(group => variationChoiceLabel(group.choices))).filter(Boolean))
  return labels.size === 1 ? `Only under ${[...labels][0]}` : 'Only under some alternatives'
}

/**
 * Alternatives of one set next to each other, at the first one's place, so a
 * matrix axis reads them together; everything else keeps its order.
 */
export function adjacentAlternatives<T extends AnyResourceView>(resources: readonly T[]): T[] {
  const placed = new Set<string>()
  return resources.flatMap((resource) => {
    const key = resource.variation?.key
    if (!key) return [resource]
    if (placed.has(key)) return []
    placed.add(key)
    return resources.filter(item => item.variation?.key === key)
  })
}
