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

const root = fileURLToPath(new URL('..', import.meta.url))
const layer = join(root, 'layers/nuxt/theme-lab')
const theme = join(root, 'layers/nuxt/theme')

/*
  The lab extends the theme, so their `public/` directories merge at runtime.
  The selected mark and lockup were promoted into the theme; the rejected
  variants stay here. Either location satisfies the shipping contract.
*/
function shipped(path: string): boolean {
  return existsSync(join(layer, 'public', path)) || existsSync(join(theme, 'public', path))
}

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
      expect(shipped(businessLensLogoSrc(variant)), variant.id).toBe(true)
      expect(shipped(businessLensLogoSrc(variant, true)), `${variant.id} dark`).toBe(true)
    }
  })

  /* The promoted pair must be in the theme, or a theme-only host has no brand. */
  it('keeps the selected mark and lockup in the stable theme layer', () => {
    const mark = BUSINESSLENS_MARK_VARIANTS.find(item => item.id === BUSINESSLENS_DEFAULT_MARK)!
    const lockup = BUSINESSLENS_LOCKUP_VARIANTS.find(item => item.id === BUSINESSLENS_DEFAULT_LOCKUP)!

    for (const variant of [mark, lockup]) {
      expect(existsSync(join(theme, 'public', businessLensLogoSrc(variant))), variant.id).toBe(true)
      expect(existsSync(join(theme, 'public', businessLensLogoSrc(variant, true))), variant.id).toBe(true)
    }

    const stableFavicon = join('brand/icons/marks', BUSINESSLENS_DEFAULT_MARK, 'favicon.svg')
    expect(readFileSync(join(theme, 'public', stableFavicon))).toEqual(
      readFileSync(join(layer, 'public', stableFavicon))
    )

    const localViewer = readFileSync(join(root, 'viewer/app/app/app.vue'), 'utf8')
    expect(localViewer).toContain(`href: '/${stableFavicon}'`)
    expect(localViewer).not.toContain('data:image/svg+xml')
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
