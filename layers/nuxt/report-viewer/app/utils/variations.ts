import type { AnyResourceView, ReportWorkspace, VariationView } from './reportWorkspace'

export const VARIATION_LABELS: Record<VariationView['kind'], string> = {
  experiment: 'Experiment', configuration: 'Configuration', version: 'Version'
}

/** Complete same-type membership, independent of containment or inspected member. */
export function variationMembers(workspace: ReportWorkspace, resource: AnyResourceView): AnyResourceView[] {
  if (!resource.variation) return []
  return [...workspace.byKey.values()].filter(item => item.kind === resource.kind
    && item.variation?.anchorId === resource.variation!.anchorId)
    .sort((a, b) => a.title.localeCompare(b.title, 'en') || a.key.localeCompare(b.key, 'en'))
}

/** Peers exclude the inspected member; neither helper privileges the anchor. */
export function variationsOf(workspace: ReportWorkspace, resource: AnyResourceView): AnyResourceView[] {
  return variationMembers(workspace, resource).filter(item => item.key !== resource.key)
}

/** Typed selection references, not availability or permission edges. */
export function variationUsageReferences(resource: AnyResourceView): { label: string, entity: string, fact?: string }[] {
  const usage = resource.variation?.usage
  if (!usage) return []
  const result: { label: string, entity: string, fact?: string }[] = []
  if ('assignmentUnit' in usage && 'entity' in usage.assignmentUnit) result.push({ label: 'Assignment unit', entity: usage.assignmentUnit.entity })
  if ('assignmentFact' in usage && usage.assignmentFact) result.push({ label: 'Assignment fact', ...usage.assignmentFact })
  if ('settings' in usage) for (const setting of usage.settings ?? []) result.push({ label: 'Setting', ...setting })
  if ('discriminator' in usage && usage.discriminator) result.push({ label: 'Version discriminator', ...usage.discriminator })
  return result
}
