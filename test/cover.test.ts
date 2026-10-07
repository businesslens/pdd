import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MAX_PRODUCT_COVER_BYTES,
  PRODUCT_COVER_FILENAME,
  productCoverDimensions,
  validateProductCover
} from '../src/logo.js'

/* Genuine WebPs written by cwebp, img2webp and webpmux, so every positive case
   is a file a renderer decodes rather than a header shaped like one. */
const fixture = (name: string) => new Uint8Array(readFileSync(join(__dirname, 'fixtures/covers', name)))
const real = new Uint8Array(readFileSync(join(__dirname, '../blueprints/kanban-board/.businesslens/product/cover.webp')))
const lossy = fixture('lossy.webp')
const lossless = fixture('lossless.webp')
const withAlpha = fixture('extended-alpha.webp')
const withIcc = fixture('extended-icc.webp')

function uint32(value: number): number[] {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]
}

/** A copy of a WebP with its RIFF size rewritten to match its new length. */
function resized(bytes: Uint8Array, length: number): Uint8Array {
  const copy = new Uint8Array(length)
  copy.set(bytes.subarray(0, Math.min(length, bytes.byteLength)))
  copy.set(uint32(length - 8), 4)
  return copy
}

/** The 30-byte header a careless validator accepts: RIFF, WEBP, VP8X and a canvas. */
function headerOnly(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(30)
  bytes.set([...'RIFF'].map(c => c.charCodeAt(0)), 0)
  bytes.set(uint32(22), 4)
  bytes.set([...'WEBP'].map(c => c.charCodeAt(0)), 8)
  bytes.set([...'VP8X'].map(c => c.charCodeAt(0)), 12)
  bytes.set(uint32(10), 16)
  bytes.set([(width - 1) & 0xff, ((width - 1) >> 8) & 0xff, ((width - 1) >> 16) & 0xff], 24)
  bytes.set([(height - 1) & 0xff, ((height - 1) >> 8) & 0xff, ((height - 1) >> 16) & 0xff], 27)
  return bytes
}

describe('Product cover contract', () => {
  it('has one fixed filename and accepts the launch catalog cover', () => {
    expect(PRODUCT_COVER_FILENAME).toBe('cover.webp')
    expect(productCoverDimensions(real)).toEqual({ width: 1600, height: 900 })
    expect(validateProductCover(real)).toEqual([])
  })

  it('accepts lossy, lossless and extended still WebPs', () => {
    for (const cover of [lossy, lossless, withAlpha, withIcc]) {
      expect(productCoverDimensions(cover)).toEqual({ width: 1200, height: 675 })
      expect(validateProductCover(cover)).toEqual([])
    }
  })

  it('refuses anything that is not a WebP image', () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"/>')
    expect(validateProductCover(svg)).toEqual(['cover.webp must be a WebP image'])
    const png = new Uint8Array(64)
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(validateProductCover(png)).toEqual(['cover.webp must be a WebP image'])
    expect(validateProductCover(new Uint8Array())).toEqual(['cover.webp must not be empty'])
  })

  it('refuses a header with no image, whatever canvas it claims', () => {
    expect(validateProductCover(headerOnly(1600, 900))).toEqual(['cover.webp must be a well-formed still WebP; it must hold exactly one image'])
    expect(validateProductCover(headerOnly(16_777_216, 9_437_184))).toEqual(['cover.webp must be a well-formed still WebP; it must hold exactly one image'])
    expect(productCoverDimensions(headerOnly(1600, 900))).toBeUndefined()
  })

  it('refuses a file whose RIFF size or chunks disagree with its length', () => {
    const wrongSize = new Uint8Array(lossy)
    wrongSize.set(uint32(lossy.byteLength), 4)
    expect(validateProductCover(wrongSize)).toEqual(['cover.webp must be a well-formed still WebP; its RIFF size does not match the file'])
    expect(validateProductCover(resized(lossy, lossy.byteLength - 40))).toEqual(['cover.webp must be a well-formed still WebP; its VP8 chunk runs past the end of the file'])
    const overflow = new Uint8Array(lossy)
    overflow.set(uint32(lossy.byteLength), 16)
    expect(validateProductCover(overflow)).toEqual(['cover.webp must be a well-formed still WebP; its VP8 chunk runs past the end of the file'])
    const trailing = resized(lossy, lossy.byteLength + 6)
    expect(validateProductCover(trailing)).toEqual(['cover.webp must be a well-formed still WebP; it ends inside a chunk header'])
  })

  it('refuses an animated WebP, a broken frame, and a canvas that does not match its image', () => {
    expect(validateProductCover(fixture('animated.webp'))).toEqual(['cover.webp must be a well-formed still WebP; it is animated'])
    const noStartCode = new Uint8Array(lossy)
    noStartCode[23] = 0
    expect(validateProductCover(noStartCode)).toEqual(['cover.webp must be a well-formed still WebP; its VP8 frame has no start code'])
    const noSignature = new Uint8Array(lossless)
    noSignature[20] = 0
    expect(validateProductCover(noSignature)).toEqual(['cover.webp must be a well-formed still WebP; its VP8L image has no signature'])
    const mismatched = new Uint8Array(withIcc)
    mismatched[24] = 0xff
    expect(validateProductCover(mismatched)).toEqual(['cover.webp must be a well-formed still WebP; its VP8X canvas does not match its image'])
    const reserved = new Uint8Array(withIcc)
    reserved[20] = reserved[20]! | 0x01
    expect(validateProductCover(reserved)).toEqual(['cover.webp must be a well-formed still WebP; its VP8X header sets reserved bits'])
  })

  it('refuses a cover that is not 16:9, too narrow, too many pixels, or too large', () => {
    expect(validateProductCover(fixture('too-small.webp'))).toEqual(['cover.webp must be at least 1200 pixels wide; it is 800'])
    const square = new Uint8Array(lossless)
    const bits = ((1600 - 1) & 0x3fff) | (((1600 - 1) & 0x3fff) << 14)
    square.set(uint32(bits), 21)
    expect(validateProductCover(square)).toEqual(['cover.webp must be 16:9; it is 1600×1600'])
    const giant = new Uint8Array(lossless)
    giant.set(uint32(((16000 - 1) & 0x3fff) | (((9000 - 1) & 0x3fff) << 14)), 21)
    expect(validateProductCover(giant)).toEqual(['cover.webp must be at most 4096×2304 pixels; it is 16000×9000'])
    const huge = new Uint8Array(MAX_PRODUCT_COVER_BYTES + 1)
    huge.set(lossy)
    expect(validateProductCover(huge)).toEqual(['cover.webp must be at most 1 MiB'])
  })
})
