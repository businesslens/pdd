import { isUtf8 } from 'node:buffer'
import { lstatSync, readFileSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'

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
