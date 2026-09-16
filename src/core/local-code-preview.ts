import { parseCodeTarget, type ParsedCodeTarget } from './coderefs.js'
import { reportResourceCollections, type ProductReportV13, type ReportReference } from './portable.js'

import { previewText } from './local-preview.js'
import { fileLanguage, highlightedCode } from './syntax-highlighting.js'
import type { ReferencePreview } from '../../layers/nuxt/report-viewer/app/utils/referencePreview.js'

/** The source mount accepts exact code targets already disclosed by the report. */
function declaredReference(report: ProductReportV13 | undefined, target: string): ReportReference | undefined {
  if (report?.referenceProfile !== 'workspace') return undefined
  const references = [
    ...report.references,
    ...Object.values(reportResourceCollections(report.model)).flatMap(resources => resources.flatMap(resource => resource.references))
  ]
  return references.find(reference => reference.kind === 'code' && reference.target === target)
}

/** Symbol lookup is deliberately textual, so it works across repository languages. */
function focusFor(lines: string[], target: ParsedCodeTarget): { first?: number, last?: number, note: string } {
  if (target.startLine !== undefined) {
    const last = target.endLine ?? target.startLine
    const note = last === target.startLine ? `Line ${last}.` : `Lines ${target.startLine}–${last}.`
    if (target.startLine < 1 || target.startLine > lines.length) return { note: `${note} The requested line is outside this file.` }
    return { first: target.startLine, last: Math.min(last, lines.length),
      note: last > lines.length ? `${note} The range extends beyond this file.` : note }
  }
  if (!target.symbol) return { note: '' }
  const leaf = target.symbol.split(/[.:#]+/).filter(Boolean).at(-1) ?? target.symbol
  for (const symbol of [...new Set([target.symbol, leaf])]) {
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = new RegExp(`(^|[^\\w$])${escaped}($|[^\\w$])`)
    const index = lines.findIndex(line => match.test(line))
    if (index !== -1) return { first: index + 1, last: index + 1, note: `First text match for ${target.symbol}.` }
  }
  return { note: `No text match for ${target.symbol} in this file.` }
}

export async function localCodePreview(report: ProductReportV13 | undefined, root: string | undefined, target: string, read?: (path: string) => string | undefined): Promise<{ status: number, data: ReferencePreview | { message: string } }> {
  const reference = declaredReference(report, target)
  const parsed = reference && parseCodeTarget(reference.target, [], 'reference')
  const source = parsed ? read ? read(parsed.path) : root ? previewText(root, parsed.path) : undefined : undefined
  if (!reference || !parsed || source === undefined) return {
    status: 404,
    data: { message: 'This code reference is unavailable in the selected report state.' }
  }
  const lines = source.split(/\r\n|\n|\r/)
  if (lines.length > 1 && lines.at(-1) === '') lines.pop()
  const focus = focusFor(lines, parsed)
  return { status: 200, data: {
    kind: 'code', path: parsed.path,
    details: String(lines.length) + (lines.length === 1 ? ' line' : ' lines') + (focus.note ? ' · ' + focus.note : ''),
    document: { nodes: [await highlightedCode(source, fileLanguage(parsed.path), { sourceFile: true, ...focus })], frontmatter: {}, meta: {} }
  } }
}
