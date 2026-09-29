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
