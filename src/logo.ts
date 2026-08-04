import { SaxesParser } from 'saxes'

/** The one Product logo location understood by BusinessLens. */
export const PRODUCT_LOGO_FILENAME = 'logo.svg'

/** Keep contributed and downloaded logos small enough to inspect and serve safely. */
export const MAX_PRODUCT_LOGO_BYTES = 256 * 1024

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/'

// Product logos are deliberately a small, static subset of SVG. Interactive,
// animated, embedded, filter, text-rendering, and network-capable elements are
// not part of the portable logo contract.
const SAFE_ELEMENTS = new Set([
  'circle',
  'clipPath',
  'defs',
  'desc',
  'ellipse',
  'g',
  'line',
  'linearGradient',
  'mask',
  'path',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  'stop',
  'svg',
  'title',
  'use'
])

const SAFE_ATTRIBUTES = new Set([
  'class',
  'clip-path',
  'clip-rule',
  'cx',
  'cy',
  'd',
  'fill',
  'fill-opacity',
  'fill-rule',
  'fr',
  'fx',
  'fy',
  'gradientTransform',
  'gradientUnits',
  'height',
  'href',
  'id',
  'mask',
  'maskContentUnits',
  'maskUnits',
  'offset',
  'opacity',
  'points',
  'preserveAspectRatio',
  'r',
  'rx',
  'ry',
  'spreadMethod',
  'stop-color',
  'stop-opacity',
  'stroke',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
  'transform',
  'version',
  'viewBox',
  'width',
  'x',
  'x1',
  'x2',
  'y',
  'y1',
  'y2'
])

const INTERNAL_FRAGMENT = /^#[A-Za-z_][A-Za-z0-9_.:-]*$/
const INTERNAL_URL = /^url\((['"]?)(#[A-Za-z_][A-Za-z0-9_.:-]*)\1\)$/i

function unsafeReference(value: string): boolean {
  if (/\\|(?:https?|data|javascript):|^\/\//i.test(value)) return true
  const compact = value.replace(/\s+/g, '')
  return /url\(/i.test(compact) && !INTERNAL_URL.test(compact)
}

/**
 * Validate the portable Product logo without evaluating or rewriting SVG.
 *
 * The parser resolves XML namespaces before the allowlist is applied, so an
 * active element cannot evade the contract through a namespace prefix. Logos
 * are still rendered through `<img>` elements and served with a script-free CSP;
 * the strict source contract is the first layer rather than the only layer.
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

  const issues = new Set<string>()
  const openElements: string[] = []
  let sawRoot = false
  let rootIsSvg = false
  let rootHasViewBox = false
  const issue = (message: string) => issues.add(`logo.svg ${message}`)
  const parser = new SaxesParser({ xmlns: true })

  parser.on('doctype', () => issue('must not contain document type or entity declarations'))
  parser.on('processinginstruction', () => issue('must not contain processing instructions'))
  parser.on('cdata', () => issue('must not contain CDATA sections'))
  parser.on('error', () => issue('must be well-formed XML'))
  parser.on('text', (text) => {
    if (text.trim() && !['title', 'desc'].includes(openElements.at(-1) ?? '')) {
      issue('must not contain rendered text')
    }
  })
  parser.on('opentag', (tag) => {
    const isRoot = openElements.length === 0
    if (isRoot) {
      sawRoot = true
      rootIsSvg = tag.local === 'svg' && tag.prefix === '' && tag.uri === SVG_NAMESPACE
    }

    if (tag.prefix || tag.uri !== SVG_NAMESPACE) {
      issue('must use only unprefixed SVG elements')
    }
    if (!SAFE_ELEMENTS.has(tag.local)) {
      issue(`must not contain unsupported <${tag.name}> elements`)
    }

    for (const attribute of Object.values(tag.attributes)) {
      if (attribute.uri === XMLNS_NAMESPACE) {
        if (attribute.name !== 'xmlns' || attribute.value !== SVG_NAMESPACE) {
          issue('must not declare prefixed or non-SVG namespaces')
        }
        continue
      }
      if (attribute.prefix) {
        issue('must not contain prefixed attributes')
        continue
      }
      if (!SAFE_ATTRIBUTES.has(attribute.local)) {
        issue(`must not contain unsupported "${attribute.name}" attributes`)
        continue
      }
      if (attribute.local.toLowerCase().startsWith('on')) {
        issue('must not contain event-handler attributes')
      }
      if (unsafeReference(attribute.value)) {
        issue('must not contain external or escaped references')
      }
      if (attribute.local === 'href' && !INTERNAL_FRAGMENT.test(attribute.value)) {
        issue('must use only same-document fragment references')
      }
      if (isRoot && attribute.local === 'viewBox' && attribute.value.trim()) {
        rootHasViewBox = true
      }
    }
    openElements.push(tag.local)
  })
  parser.on('closetag', () => {
    openElements.pop()
  })

  try {
    parser.write(source).close()
  } catch {
    issue('must be well-formed XML')
  }

  if (!sawRoot || !rootIsSvg || !rootHasViewBox) {
    issue('must have an SVG root with a viewBox')
  }
  return [...issues]
}
