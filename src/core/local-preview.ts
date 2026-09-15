import { isUtf8 } from 'node:buffer'
import { lstatSync, readFileSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]!)

/** Read a regular UTF-8 file inside the repository without following symlinks. */
export function previewText(root: string, path: string): string | undefined {
  const base = resolve(root)
  const file = resolve(base, path)
  if (!file.startsWith(`${base}${sep}`)) return undefined
  try {
    let part = base
    for (const segment of relative(base, file).split(sep)) {
      part = resolve(part, segment)
      if (lstatSync(part).isSymbolicLink()) return undefined
    }
    const maximum = 2 * 1024 * 1024
    const stat = lstatSync(file)
    if (!stat.isFile() || stat.size > maximum) return undefined
    const bytes = readFileSync(file)
    if (bytes.byteLength > maximum || bytes.includes(0) || !isUtf8(bytes)) return undefined
    return bytes.toString('utf8')
  } catch { return undefined }
}

export function previewDocument(options: {
  title: string, details?: string, kind: 'Source' | 'Document', body: string, styles: string, actions?: string
}): string {
  const titleTag = options.kind === 'Source' ? 'h1' : 'p'
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(options.title)} · ${options.kind}</title>
<style>
:root{color-scheme:light dark;--background:#fbf8f0;--text:#29251f;--muted:#786e5b;--border:#ded5c3;--highlight:#f2e4ba;--surface:#f3eee2;--link:#70530f}
@media(prefers-color-scheme:dark){:root{--background:#191919;--text:#e8e5df;--muted:#aaa394;--border:#383630;--highlight:#39331e;--surface:#24231f;--link:#e9ce87}}
*{box-sizing:border-box}body{margin:0;background:var(--background);color:var(--text);font:14px/1.5 system-ui,sans-serif}
.preview-header{position:sticky;top:0;z-index:1;padding:16px 24px;border-bottom:1px solid var(--border);background:var(--background);display:flex;align-items:center;gap:16px}
.preview-heading{min-width:0;flex:1}.preview-title{font-size:18px;font-weight:600;margin:0;overflow-wrap:anywhere}
.preview-details{margin:4px 0 0;color:var(--muted);overflow-wrap:anywhere}.preview-actions{flex-shrink:0}
.preview-actions a{color:var(--muted);text-underline-offset:3px}.message{margin:0 24px}
${options.styles}
</style></head><body><header class="preview-header"><div class="preview-heading"><${titleTag} class="preview-title">${escapeHtml(options.title)}</${titleTag}>${options.details ? `<p class="preview-details">${escapeHtml(options.details)}</p>` : ''}</div>${options.actions ? `<nav class="preview-actions" aria-label="Document actions">${options.actions}</nav>` : ''}</header><main>${options.body}</main></body></html>`
}
