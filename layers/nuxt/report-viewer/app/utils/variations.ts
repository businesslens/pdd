import type { AnyResourceView, ReportWorkspace, VariationKind, VariationSetView } from './reportWorkspace'

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

/** What the pill on a title says: a set's subtype and size, or an alternative's set. */
export function variationPillLabel(workspace: ReportWorkspace, resource: AnyResourceView): string | undefined {
  if (resource.kind === 'variation') {
    const count = resource.alternatives.length
    return `${VARIATION_LABELS[resource.variationKind]} · ${count} ${count === 1 ? 'alternative' : 'alternatives'}`
  }
  if (!resource.variation) return undefined
  const set = variationSetOf(workspace, resource)
  const title = set?.title ?? resource.variation.title
  return resource.variation.label ? `${title} · ${resource.variation.label}` : title
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
