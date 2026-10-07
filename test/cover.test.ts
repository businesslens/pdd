import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MAX_PRODUCT_COVER_BYTES,
  PRODUCT_COVER_FILENAME,
  productCoverDimensions,
  validateProductCover
} from '../src/logo.js'

const real = readFileSync(join(__dirname, '../blueprints/kanban-board/.businesslens/product/cover.webp'))

/** A minimal RIFF/WEBP header whose first chunk is VP8X with the given canvas. */
function vp8x(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(30)
  bytes.set([...'RIFF'].map(c => c.charCodeAt(0)), 0)
  bytes.set([...'WEBP'].map(c => c.charCodeAt(0)), 8)
  bytes.set([...'VP8X'].map(c => c.charCodeAt(0)), 12)
  const w = width - 1
  const h = height - 1
  bytes.set([w & 0xff, (w >> 8) & 0xff, (w >> 16) & 0xff], 24)
  bytes.set([h & 0xff, (h >> 8) & 0xff, (h >> 16) & 0xff], 27)
  return bytes
}

/** The same for a lossless VP8L header. */
function vp8l(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(30)
  bytes.set([...'RIFF'].map(c => c.charCodeAt(0)), 0)
  bytes.set([...'WEBP'].map(c => c.charCodeAt(0)), 8)
  bytes.set([...'VP8L'].map(c => c.charCodeAt(0)), 12)
  bytes[20] = 0x2f
  const bits = ((width - 1) & 0x3fff) | (((height - 1) & 0x3fff) << 14)
  bytes.set([bits & 0xff, (bits >>> 8) & 0xff, (bits >>> 16) & 0xff, (bits >>> 24) & 0xff], 21)
  return bytes
}

describe('Product cover contract', () => {
  it('has one fixed filename and accepts a 16:9 WebP of the launch catalog', () => {
    expect(PRODUCT_COVER_FILENAME).toBe('cover.webp')
    expect(productCoverDimensions(real)).toEqual({ width: 1600, height: 900 })
    expect(validateProductCover(real)).toEqual([])
  })

  it('reads the canvas from lossy, extended and lossless headers alike', () => {
    expect(productCoverDimensions(vp8x(1920, 1080))).toEqual({ width: 1920, height: 1080 })
    expect(productCoverDimensions(vp8l(1280, 720))).toEqual({ width: 1280, height: 720 })
    expect(validateProductCover(vp8x(1920, 1080))).toEqual([])
    expect(validateProductCover(vp8l(1280, 720))).toEqual([])
  })

  it('refuses anything that is not a WebP image', () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"/>')
    expect(validateProductCover(svg)).toEqual(['cover.webp must be a WebP image'])
    const png = new Uint8Array(64)
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(validateProductCover(png)).toEqual(['cover.webp must be a WebP image'])
    expect(validateProductCover(new Uint8Array())).toEqual(['cover.webp must not be empty'])
  })

  it('refuses a cover that is not 16:9, too narrow, or too large', () => {
    expect(validateProductCover(vp8x(1600, 1600))).toEqual(['cover.webp must be 16:9; it is 1600×1600'])
    expect(validateProductCover(vp8x(800, 450))).toEqual(['cover.webp must be at least 1200 pixels wide; it is 800'])
    const huge = new Uint8Array(MAX_PRODUCT_COVER_BYTES + 1)
    huge.set(vp8x(1600, 900))
    expect(validateProductCover(huge)).toEqual(['cover.webp must be at most 1 MiB'])
  })
})
