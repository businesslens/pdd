import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  BUSINESSLENS_DARK_BACKGROUNDS,
  BUSINESSLENS_DEFAULT_DARK_BACKGROUND,
  BUSINESSLENS_DEFAULT_LIGHT_BACKGROUND,
  BUSINESSLENS_DEFAULT_LOCKUP,
  BUSINESSLENS_DEFAULT_MARK,
  BUSINESSLENS_LIGHT_BACKGROUNDS,
  BUSINESSLENS_LOCKUP_VARIANTS,
  BUSINESSLENS_MARK_VARIANTS,
  businessLensLogoSrc
} from '../layers/nuxt/theme-lab/app/utils/businesslensThemeLabVariants.js'

const layer = join(
  fileURLToPath(new URL('..', import.meta.url)),
  'layers/nuxt/theme-lab'
)

const iconFiles = [
  'favicon.svg',
  'favicon.ico',
  'favicon-32.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'maskable-icon-512.png',
  'site.webmanifest'
]

describe('shared BusinessLens theme lab', () => {
  it('exposes compiled variants to plain Node package consumers', async () => {
    const published = await import('businesslens/theme-lab/variants')
    expect(published.BUSINESSLENS_DEFAULT_LIGHT_BACKGROUND).toBe('l4')
    expect(published.BUSINESSLENS_MARK_VARIANTS).toEqual(BUSINESSLENS_MARK_VARIANTS)
  })

  it('keeps the approved starting selections as experimental defaults', () => {
    expect(BUSINESSLENS_LIGHT_BACKGROUNDS.find(item => item.id === BUSINESSLENS_DEFAULT_LIGHT_BACKGROUND)?.name)
      .toBe('Glow')
    expect(BUSINESSLENS_DARK_BACKGROUNDS.find(item => item.id === BUSINESSLENS_DEFAULT_DARK_BACKGROUND)?.name)
      .toBe('Espresso')
    expect(BUSINESSLENS_MARK_VARIANTS.find(item => item.id === BUSINESSLENS_DEFAULT_MARK)?.name)
      .toBe('Bare')
    expect(BUSINESSLENS_LOCKUP_VARIANTS.find(item => item.id === BUSINESSLENS_DEFAULT_LOCKUP)?.name)
      .toBe('Stamp')
  })

  it('ships both color-mode drawings for every active mark and lockup', () => {
    for (const variant of [...BUSINESSLENS_MARK_VARIANTS, ...BUSINESSLENS_LOCKUP_VARIANTS]) {
      expect(existsSync(join(layer, 'public', businessLensLogoSrc(variant)))).toBe(true)
      expect(existsSync(join(layer, 'public', businessLensLogoSrc(variant, true)))).toBe(true)
    }
  })

  it('ships a complete favicon family for every active mark', () => {
    for (const mark of BUSINESSLENS_MARK_VARIANTS) {
      for (const file of iconFiles) {
        expect(existsSync(join(layer, 'public/brand/icons/marks', mark.id, file))).toBe(true)
      }
    }

    expect(readFileSync(join(layer, 'public/favicon.ico'))).toEqual(
      readFileSync(join(layer, 'public/brand/icons/marks', BUSINESSLENS_DEFAULT_MARK, 'favicon.ico'))
    )
  })
})
