import { parseCodeTarget, type ParsedCodeTarget } from './coderefs.js'
import { reportResourceCollections, type ProductReportV13, type ReportReference } from './portable.js'

import { escapeHtml, previewDocument, previewText } from './local-preview.js'

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

function document(title: string, details: string, body: string): string {
  return previewDocument({ title, details, kind: 'Source', body, styles: `
main{padding:16px 0}pre{margin:0;overflow:auto;tab-size:2}code{font:13px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;display:block;min-width:max-content}
.line{display:block;min-height:1.6em;padding-right:24px;scroll-margin-top:9rem}.highlight{background:var(--highlight)}
.line:target{background:var(--highlight)}.number{display:inline-block;width:6ch;margin-right:20px;text-align:right;color:var(--muted);text-decoration:none;user-select:none}
.number:hover{text-decoration:underline}#reference{scroll-margin-top:9rem}.message{margin:0 24px}
` })
}

export function localCodePreview(report: ProductReportV13 | undefined, root: string | undefined, target: string): { status: number, html: string } {
  const reference = declaredReference(report, target)
  const parsed = reference && parseCodeTarget(reference.target, [], 'reference')
  const source = root && parsed ? previewText(root, parsed.path) : undefined
  if (!reference || !parsed || source === undefined) return {
    status: 404,
    html: document('Source unavailable', '', '<p class="message">This code reference is unavailable. Open it from the current local report with its repository files present.</p>')
  }
  const lines = source.split(/\r\n|\n|\r/)
  if (lines.length > 1 && lines.at(-1) === '') lines.pop()
  const focus = focusFor(lines, parsed)
  const markup = lines.map((line, index) => {
    const number = index + 1
    const highlighted = focus.first !== undefined && number >= focus.first && number <= focus.last!
    const anchor = number === (focus.first ?? 1) ? '<span id="reference"></span>' : ''
    return `<span class="line${highlighted ? ' highlight' : ''}" id="L${number}">${anchor}<a class="number" href="#L${number}" aria-label="Line ${number}">${number}</a>${escapeHtml(line)}</span>`
  }).join('')
  const title = reference.title || parsed.path
  const details = `${reference.title ? `${parsed.path} · ` : ''}${lines.length} ${lines.length === 1 ? 'line' : 'lines'}${focus.note ? ` · ${focus.note}` : ''}`
  return { status: 200, html: document(title, details, `<pre aria-label="Source code"><code>${markup}</code></pre>`) }
}
