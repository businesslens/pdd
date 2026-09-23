/** Navigation only: the selected path is separate from authored Coverage. */
export interface CoverageReading {
  /** A repository location whose recorded context is open. */
  path: string | null
}

export const defaultCoverageReading = (): CoverageReading => ({ path: null })

export function coverageFromQuery(query: Record<string, unknown>): CoverageReading {
  return {
    path: typeof query.cp === 'string' && query.cp.trim() ? query.cp : null
  }
}

export function coverageToQuery(reading: CoverageReading) {
  return { cp: reading.path || undefined }
}
