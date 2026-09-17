/** Optional local host context; never part of a Product Report or Blueprint. */
export type RepositoryChange = 'added' | 'modified' | 'deleted' | 'unavailable'
export interface RepositoryFileChange {
  path: string
  change: RepositoryChange
  beforeMode?: string
  afterMode?: string
  reason?: string
}
export interface RepositoryDiff {
  /** Union of both inventories, including unchanged context and deleted files. */
  paths: string[]
  files: RepositoryFileChange[]
}
export type RepositoryFileReading =
  | { status: 'text', text: string, bytes: number, mode: string }
  | { status: 'binary' | 'large', bytes: number, mode: string }
  | { status: 'missing' }
  | { status: 'unavailable', reason: string }
export interface RepositoryFileComparison {
  path: string
  before: RepositoryFileReading
  after: RepositoryFileReading
}
export type RepositoryFileLoader = (base: string, target: string, path: string) => Promise<RepositoryFileComparison>
