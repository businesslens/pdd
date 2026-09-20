import type { RepositoryChange, RepositoryDiff } from 'businesslens/report'
import type { MatrixBadgeTone } from './matrixBadges'
import { repositoryModelKind } from './repositoryTree'
import { resourceKey, type ReportWorkspace } from './reportWorkspace'

/** Shared meanings and colors for Review's tree, legend and header counts. */
export const reviewChangeMeta = {
  added: { label: 'Added', symbol: '+', tone: 'creates', description: 'A file added since the earlier version.' },
  modified: { label: 'Modified', symbol: '~', tone: 'changes', description: 'File contents or mode changed.' },
  deleted: { label: 'Deleted', symbol: '−', tone: 'removes', description: 'A file removed since the earlier version.' },
  unavailable: { label: 'Unavailable', symbol: '?', tone: 'neutral', description: 'The change could not be determined because a file could not be read.' }
} satisfies Record<RepositoryChange, { label: string, symbol: string, tone: MatrixBadgeTone, description: string }>

export function isReviewModelPath(diff: Pick<RepositoryDiff, 'modelPath'>, path: string): boolean {
  if (!path.startsWith(`${diff.modelPath}/`)) return false
  const parts = path.slice(diff.modelPath.length + 1).split('/')
  return !['build', 'cache'].includes(parts[0]!) && !parts.includes('.git')
}

export function reviewModelFiles(diff: RepositoryDiff) {
  return diff.files.filter(file => isReviewModelPath(diff, file.path))
}

/** Resolve the authored resource itself, rather than References pointing at it. */
export function reviewFileResource(workspace: ReportWorkspace | null, modelPath: string, path: string) {
  if (!workspace || !isReviewModelPath({ modelPath }, path)) return null
  const kind = repositoryModelKind({ value: path, directory: false })
  if (!kind || kind === 'product') return null
  const parts = path.slice(modelPath.length + 1).split('/')
  const expanded = parts.length % 2 === 1
  const ids = parts.filter((_, index) => index % 2 === 1).map(part => part.replace(/\.md$/, ''))
  const id = kind === 'experience' || kind === 'screen' ? ids.join('::') : ids.at(-1)!
  const resource = workspace.byKey.get(resourceKey(kind, id))
  if (!resource) return null
  if (resource.kind === 'capability-scenario' && resource.capabilityId !== ids[0]) return null
  if (resource.kind === 'journey-scenario' && resource.journeyId !== ids[0]) return null
  // Expanded assets are not independent resource files.
  if (expanded && parts.at(-1) !== `${kind === 'rule' ? 'business-rule' : kind}.md`) return null
  return resource
}
