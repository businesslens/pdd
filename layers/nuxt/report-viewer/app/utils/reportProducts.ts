/** Host-owned destinations; product switching never changes the report contract. */
export interface ReportProductLink {
  label: string
  to: string
  logoSrc?: string | null
  active?: boolean
}

/** Optional destination for browsing the host's full product catalog. */
export type ReportProductCatalogLink = Pick<ReportProductLink, 'label' | 'to'>
