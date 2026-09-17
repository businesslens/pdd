/** Host-owned destinations; product switching never changes the report contract. */
export interface ReportProductLink {
  label: string
  to: string
  logoSrc?: string | null
  active?: boolean
}
