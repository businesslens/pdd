/** The one Product logo location understood by BusinessLens. */
export const PRODUCT_LOGO_FILENAME = 'logo.svg'

/** Keep contributed and downloaded logos small enough to inspect and serve safely. */
export const MAX_PRODUCT_LOGO_BYTES = 256 * 1024

/**
 * Validate the portable Product logo contract without evaluating or rewriting SVG.
 *
 * Logos are always rendered through an `<img>` element, never injected into a
 * document. Requiring a self-contained SVG additionally prevents a logo from
 * becoming a hidden network or active-content surface in the local viewer.
 */
export function validateProductLogo(input: string | Uint8Array): string[] {
  const byteLength = typeof input === 'string'
    ? new TextEncoder().encode(input).byteLength
    : input.byteLength

  if (byteLength === 0) return ['logo.svg must not be empty']
  if (byteLength > MAX_PRODUCT_LOGO_BYTES) {
    return [`logo.svg must be at most ${MAX_PRODUCT_LOGO_BYTES / 1024} KiB`]
  }

  let source: string
  try {
    source = typeof input === 'string'
      ? input
      : new TextDecoder('utf-8', { fatal: true }).decode(input)
  } catch {
    return ['logo.svg must be valid UTF-8']
  }

  const issues: string[] = []
  const document = source
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/^(?:<\?xml\b[^?]*\?>\s*)?(?:(?:<!--[\s\S]*?-->)\s*)*/i, '')
  if (!/^<svg\b[^>]*\bviewBox\s*=\s*["'][^"']+["'][^>]*>/i.test(document)) {
    issues.push('logo.svg must have an SVG root with a viewBox')
  }
  if (!/<\/svg>\s*$/i.test(document)) issues.push('logo.svg must end with a closing SVG element')

  const forbidden: Array<[RegExp, string]> = [
    [/<!(?:doctype|entity)\b/i, 'document type or entity declarations'],
    [/<(?:script|foreignObject|iframe|object|embed|image)\b/i, 'active or embedded content'],
    [/\bon[a-z]+\s*=/i, 'event-handler attributes'],
    [/(?:href|xlink:href)\s*=\s*["'](?!#)/i, 'external references'],
    [/@import\b/i, 'CSS imports']
  ]
  for (const [pattern, label] of forbidden) {
    if (pattern.test(source)) issues.push(`logo.svg must not contain ${label}`)
  }
  for (const match of source.matchAll(/url\s*\(\s*(["']?)(.*?)\1\s*\)/gis)) {
    if (!match[2]?.trim().startsWith('#')) {
      issues.push('logo.svg must not contain external CSS URLs')
      break
    }
  }
  return issues
}
