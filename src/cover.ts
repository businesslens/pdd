/** The one Product cover location understood by BusinessLens. */
export const PRODUCT_COVER_FILENAME = 'cover.webp'

/**
 * A cover is a raster illustration, so it is allowed four times the logo's
 * 256 KiB; a 1600×900 engraving compresses to well under half of it.
 */
export const MAX_PRODUCT_COVER_BYTES = 1024 * 1024

/** Narrower than this and a card's 16:9 band upsamples it on a wide screen. */
export const MIN_PRODUCT_COVER_WIDTH = 1200

/**
 * The pixel ceiling: a card never shows a cover wider than this, and a header
 * alone could otherwise claim a canvas a renderer would refuse to allocate.
 */
export const MAX_PRODUCT_COVER_WIDTH = 4096
export const MAX_PRODUCT_COVER_HEIGHT = 2304

/** Covers are drawn for a 16:9 band; one percent absorbs rounding, nothing more. */
const COVER_RATIO = 16 / 9
const COVER_RATIO_TOLERANCE = 0.01

/** Chunks a still extended WebP may carry beside its one image. */
const EXTENDED_SIDE_CHUNKS = new Set(['ICCP', 'ALPH', 'EXIF', 'XMP '])
const IMAGE_CHUNKS = new Set(['VP8 ', 'VP8L'])

export interface ProductCoverDimensions {
  width: number
  height: number
}

interface Chunk {
  fourcc: string
  start: number
  size: number
}

type Parsed = { ok: true, dimensions: ProductCoverDimensions } | { ok: false, reason: string }

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length))
}

function uint24(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16)
}

function uint32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16) | (bytes[offset + 3]! << 24)) >>> 0
}

/** The size an image chunk's own header declares, or why it has none. */
function imageDimensions(bytes: Uint8Array, chunk: Chunk): Parsed {
  const at = chunk.start
  if (chunk.fourcc === 'VP8 ') {
    if (chunk.size < 10) return { ok: false, reason: 'its VP8 frame is truncated' }
    if ((bytes[at]! & 1) !== 0) return { ok: false, reason: 'its VP8 frame is not a key frame' }
    if (bytes[at + 3] !== 0x9d || bytes[at + 4] !== 0x01 || bytes[at + 5] !== 0x2a) {
      return { ok: false, reason: 'its VP8 frame has no start code' }
    }
    return {
      ok: true,
      dimensions: {
        width: (bytes[at + 6]! | (bytes[at + 7]! << 8)) & 0x3fff,
        height: (bytes[at + 8]! | (bytes[at + 9]! << 8)) & 0x3fff
      }
    }
  }
  if (chunk.size < 5) return { ok: false, reason: 'its VP8L image is truncated' }
  if (bytes[at] !== 0x2f) return { ok: false, reason: 'its VP8L image has no signature' }
  const bits = uint32(bytes, at + 1)
  if (bits >>> 29 !== 0) return { ok: false, reason: 'its VP8L image declares an unknown version' }
  return { ok: true, dimensions: { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 } }
}

/**
 * Walk a WebP's RIFF container without decoding pixels: the RIFF size must
 * match the file, every chunk must lie inside it, and it must hold exactly one
 * still image — a lone `VP8 ` or `VP8L` chunk, or a `VP8X` header whose canvas
 * matches that one image, with only colour profile, alpha and metadata beside
 * it. Header-only, truncated, padded-out and animated files are refused.
 */
function parseWebp(bytes: Uint8Array): Parsed {
  if (bytes.byteLength < 20 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 4) !== 'WEBP') {
    return { ok: false, reason: 'not a WebP image' }
  }
  if (uint32(bytes, 4) + 8 !== bytes.byteLength) {
    return { ok: false, reason: 'its RIFF size does not match the file' }
  }
  const chunks: Chunk[] = []
  let offset = 12
  while (offset < bytes.byteLength) {
    if (offset + 8 > bytes.byteLength) return { ok: false, reason: 'it ends inside a chunk header' }
    const size = uint32(bytes, offset + 4)
    const end = offset + 8 + size + (size & 1)
    if (end > bytes.byteLength) return { ok: false, reason: `its ${ascii(bytes, offset, 4).trim()} chunk runs past the end of the file` }
    chunks.push({ fourcc: ascii(bytes, offset, 4), start: offset + 8, size })
    offset = end
  }
  const [first, ...rest] = chunks
  if (!first) return { ok: false, reason: 'it holds no image' }
  if (IMAGE_CHUNKS.has(first.fourcc)) {
    if (rest.length) return { ok: false, reason: 'a simple WebP holds only its one image chunk' }
    return imageDimensions(bytes, first)
  }
  if (first.fourcc !== 'VP8X') return { ok: false, reason: 'it holds no image' }
  if (first.size !== 10) return { ok: false, reason: 'its VP8X header has the wrong size' }
  const flags = bytes[first.start]!
  if ((flags & 0xc1) !== 0 || bytes[first.start + 1] || bytes[first.start + 2] || bytes[first.start + 3]) {
    return { ok: false, reason: 'its VP8X header sets reserved bits' }
  }
  if (flags & 0x02 || rest.some(chunk => chunk.fourcc === 'ANIM' || chunk.fourcc === 'ANMF')) {
    return { ok: false, reason: 'it is animated' }
  }
  const images = rest.filter(chunk => IMAGE_CHUNKS.has(chunk.fourcc))
  if (images.length !== 1) return { ok: false, reason: 'it must hold exactly one image' }
  const stray = rest.find(chunk => !IMAGE_CHUNKS.has(chunk.fourcc) && !EXTENDED_SIDE_CHUNKS.has(chunk.fourcc))
  if (stray) return { ok: false, reason: `it carries an unexpected ${stray.fourcc.trim()} chunk` }
  const image = imageDimensions(bytes, images[0]!)
  if (!image.ok) return image
  const canvas = { width: 1 + uint24(bytes, first.start + 4), height: 1 + uint24(bytes, first.start + 7) }
  if (canvas.width !== image.dimensions.width || canvas.height !== image.dimensions.height) {
    return { ok: false, reason: 'its VP8X canvas does not match its image' }
  }
  return { ok: true, dimensions: canvas }
}

/** A well-formed still WebP's size, or `undefined` for anything else. */
export function productCoverDimensions(bytes: Uint8Array): ProductCoverDimensions | undefined {
  const parsed = parseWebp(bytes)
  return parsed.ok ? parsed.dimensions : undefined
}

/**
 * Validate a Product cover: a well-formed still WebP, 16:9, 1200 to 4096 pixels
 * wide and at most 2304 high, and at most 1 MiB. It is presentation for
 * catalogs, read only as an image and never as product meaning, so the contract
 * checks the container a renderer reads and nothing the illustration says.
 */
export function validateProductCover(input: Uint8Array): string[] {
  if (input.byteLength === 0) return ['cover.webp must not be empty']
  if (input.byteLength > MAX_PRODUCT_COVER_BYTES) {
    return [`cover.webp must be at most ${MAX_PRODUCT_COVER_BYTES / 1024 / 1024} MiB`]
  }
  const parsed = parseWebp(input)
  if (!parsed.ok) {
    return [parsed.reason === 'not a WebP image'
      ? 'cover.webp must be a WebP image'
      : `cover.webp must be a well-formed still WebP; ${parsed.reason}`]
  }
  const issues: string[] = []
  const { width, height } = parsed.dimensions
  if (width < MIN_PRODUCT_COVER_WIDTH) {
    issues.push(`cover.webp must be at least ${MIN_PRODUCT_COVER_WIDTH} pixels wide; it is ${width}`)
  }
  if (width > MAX_PRODUCT_COVER_WIDTH || height > MAX_PRODUCT_COVER_HEIGHT) {
    issues.push(`cover.webp must be at most ${MAX_PRODUCT_COVER_WIDTH}×${MAX_PRODUCT_COVER_HEIGHT} pixels; it is ${width}×${height}`)
  }
  if (!height || Math.abs(width / height - COVER_RATIO) / COVER_RATIO > COVER_RATIO_TOLERANCE) {
    issues.push(`cover.webp must be 16:9; it is ${width}×${height}`)
  }
  return issues
}
