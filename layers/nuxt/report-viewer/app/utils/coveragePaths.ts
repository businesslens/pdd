import type { ReportWorkspace } from './reportWorkspace'
import { referencePath } from './referenceNavigation'

export const normalizeCoveragePath = (path: string) => path === './' ? '.' : path.replace(/^\.\//, '').replace(/\/$/, '')

/** Select recorded context at or beneath a path; parent annotations never propagate to files. */
export function coveragePathContext(workspace: Pick<ReportWorkspace, 'coverage' | 'references'>, path: string) {
  const selected = normalizeCoveragePath(path)
  const contains = (candidate: string) => {
    const key = normalizeCoveragePath(candidate)
    return selected === '.' || key === selected || key.startsWith(`${selected}/`)
  }
  const areas = (kind: 'covered' | 'exclusions' | 'unmapped' | 'limitations') =>
    workspace.coverage[kind].filter(area => selected === '.' || area.paths.some(contains))
  const owners = new Map<string, { key: string, title: string, references: ReportWorkspace['identity']['references'] }>()
  for (const group of workspace.references) {
    const file = referencePath(group.reference)
    if (!file || !contains(file)) continue
    if (!owners.has(group.ownerKey)) owners.set(group.ownerKey, { key: group.ownerKey, title: group.ownerTitle, references: [] })
    owners.get(group.ownerKey)!.references.push(group.reference)
  }
  return {
    covered: areas('covered'),
    exclusions: areas('exclusions'),
    unmapped: areas('unmapped'),
    limitations: areas('limitations'),
    owners: [...owners.values()]
  }
}
