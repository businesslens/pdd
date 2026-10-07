/** The one Product cover location understood by BusinessLens. */
export const PRODUCT_COVER_FILENAME = 'cover.webp'

/**
 * A cover is a raster illustration, so it is allowed four times the logo's
 * 256 KiB; a 1600×900 engraving compresses to well under half of it.
 */
export const MAX_PRODUCT_COVER_BYTES = 1024 * 1024

/** Narrower than this and a card's 16:9 band upsamples it on a wide screen. */
export const MIN_PRODUCT_COVER_WIDTH = 1200

/** Covers are drawn for a 16:9 band; one percent absorbs rounding, nothing more. */
const COVER_RATIO = 16 / 9
const COVER_RATIO_TOLERANCE = 0.01

export interface ProductCoverDimensions {
  width: number
  height: number
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length))
}

function uint24(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16)
}

/**
 * Read a WebP's canvas size from its first chunk, without decoding it: `VP8X`
 * carries the canvas, `VP8 ` (lossy) its frame header, `VP8L` (lossless) its
 * packed header. Anything else is not a WebP this contract accepts.
 */
export function productCoverDimensions(bytes: Uint8Array): ProductCoverDimensions | undefined {
  if (bytes.byteLength < 30) return undefined
  if (ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 4) !== 'WEBP') return undefined
  const chunk = ascii(bytes, 12, 4)
  if (chunk === 'VP8X') {
    return { width: 1 + uint24(bytes, 24), height: 1 + uint24(bytes, 27) }
  }
  if (chunk === 'VP8 ') {
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return undefined
    return {
      width: (bytes[26]! | (bytes[27]! << 8)) & 0x3fff,
      height: (bytes[28]! | (bytes[29]! << 8)) & 0x3fff
    }
  }
  if (chunk === 'VP8L') {
    if (bytes[20] !== 0x2f) return undefined
    const bits = (bytes[21]! | (bytes[22]! << 8) | (bytes[23]! << 16) | (bytes[24]! << 24)) >>> 0
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }
  }
  return undefined
}

/**
 * Validate a Product cover: a WebP image, 16:9, at least 1200 pixels wide and at
 * most 1 MiB. It is presentation for catalogs, read only as an image and never
 * as product meaning, so the contract checks what a renderer needs and nothing
 * the illustration says.
 */
export function validateProductCover(input: Uint8Array): string[] {
  if (input.byteLength === 0) return ['cover.webp must not be empty']
  if (input.byteLength > MAX_PRODUCT_COVER_BYTES) {
    return [`cover.webp must be at most ${MAX_PRODUCT_COVER_BYTES / 1024 / 1024} MiB`]
  }
  const dimensions = productCoverDimensions(input)
  if (!dimensions) return ['cover.webp must be a WebP image']
  const issues: string[] = []
  const { width, height } = dimensions
  if (width < MIN_PRODUCT_COVER_WIDTH) {
    issues.push(`cover.webp must be at least ${MIN_PRODUCT_COVER_WIDTH} pixels wide; it is ${width}`)
  }
  if (!height || Math.abs(width / height - COVER_RATIO) / COVER_RATIO > COVER_RATIO_TOLERANCE) {
    issues.push(`cover.webp must be 16:9; it is ${width}×${height}`)
  }
  return issues
}
