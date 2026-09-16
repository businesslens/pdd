import type { MarkdownDocument } from 'comark'

/** Local repository content travels separately from the Product Report. */
export interface ReferencePreview {
  kind: 'markdown' | 'code'
  path: string
  document: MarkdownDocument
  metadata?: string | null
  details?: string
}
