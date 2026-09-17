/** Navigation only: no repository accounting enters the report document. */
export interface CoverageReading {
  /** `.` selects model-wide context at the repository root. */
  path: string | null
}

export const COVERAGE_ROOT = '.'
export const defaultCoverageReading = (): CoverageReading => ({ path: null })

export function coverageFromQuery(query: Record<string, unknown>): CoverageReading {
  return {
    path: typeof query.cp === 'string' && query.cp.trim() ? query.cp : null
  }
}

export function coverageToQuery(reading: CoverageReading) {
  return { cp: reading.path || undefined }
}
