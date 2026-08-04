import markManifest from './businesslensThemeLabMarks.mjs'

export interface BusinessLensBackgroundVariant {
  /** Value written to `<html data-bg-light>` / `<html data-bg-dark>`. */
  id: string
  name: string
  tagline: string
  /** Preview fill for the switcher chip — mirrors the CSS treatment. */
  preview: string
  /** Browser chrome color used while this variant is active. */
  themeColor: string
}

export const BUSINESSLENS_LIGHT_BACKGROUNDS: BusinessLensBackgroundVariant[] = [
  {
    id: 'l2',
    name: 'Oat',
    tagline: 'A clear step off white',
    preview: '#f5efe2',
    themeColor: '#f5efe2'
  },
  {
    id: 'l4',
    name: 'Glow',
    tagline: 'Light pooling behind the hero',
    preview: 'radial-gradient(ellipse at 50% 0%, #fefcf7 10%, #f4ecdb 80%)',
    themeColor: '#f4ecdb'
  }
]

export const BUSINESSLENS_DARK_BACKGROUNDS: BusinessLensBackgroundVariant[] = [
  {
    id: 'd1',
    name: 'Espresso',
    tagline: 'Flat, the current dark canvas',
    preview: '#1b1713',
    themeColor: '#1b1713'
  },
  {
    id: 'd2',
    name: 'Wash',
    tagline: 'Lifted at the top, deepest at the foot',
    preview: 'linear-gradient(180deg, #241e18, #141110)',
    themeColor: '#241e18'
  },
  {
    id: 'd3',
    name: 'Ember',
    tagline: 'Warm light pooling behind the hero',
    preview: 'radial-gradient(ellipse at 50% 0%, #2a2019 10%, #1b1713 80%)',
    themeColor: '#1b1713'
  },
  {
    id: 'd4',
    name: 'Ink',
    tagline: 'Deepest, with a soft vignette',
    preview: 'radial-gradient(ellipse at 50% 40%, #1c1815 10%, #141110 85%)',
    themeColor: '#141110'
  }
]

export const BUSINESSLENS_DEFAULT_LIGHT_BACKGROUND = 'l4'
export const BUSINESSLENS_DEFAULT_DARK_BACKGROUND = 'd1'

export function findBusinessLensBackground(
  list: BusinessLensBackgroundVariant[],
  id: string | null | undefined,
  fallback: string
) {
  return list.find(item => item.id === id) ?? list.find(item => item.id === fallback)!
}

export type BusinessLensLogoDisplay = 'mark' | 'lockup'

export interface BusinessLensLogoVariant {
  id: string
  name: string
  tagline: string
  /** Basename under `/brand/logo/variants`, without the `-dark` suffix. */
  file: string
}

export interface BusinessLensLockupVariant extends BusinessLensLogoVariant {
  direction: 'row' | 'column'
  wordmarkHeight: number
  symbolScale: number
  gapRatio: number
}

export const BUSINESSLENS_MARK_VARIANTS: BusinessLensLogoVariant[] = markManifest.marks

const BUSINESSLENS_STAMP_GEOMETRY = {
  direction: 'row',
  wordmarkHeight: 26,
  symbolScale: 1.31,
  gapRatio: 0.25
} as const

export const BUSINESSLENS_LOCKUP_VARIANTS: BusinessLensLockupVariant[] = [
  {
    id: 'k3',
    name: 'Stamp',
    tagline: 'Letterspaced caps between hairline rules',
    file: 'wordmark-3',
    ...BUSINESSLENS_STAMP_GEOMETRY
  },
  {
    id: 'k11',
    name: 'Brass Lens',
    tagline: 'Neutral Business with the Lens in brass',
    file: 'wordmark-11',
    ...BUSINESSLENS_STAMP_GEOMETRY
  }
]

export const BUSINESSLENS_DEFAULT_MARK = markManifest.defaultMark
export const BUSINESSLENS_DEFAULT_LOCKUP = 'k3'
export const BUSINESSLENS_DEFAULT_LOGO_DISPLAY: BusinessLensLogoDisplay = 'lockup'

const BUSINESSLENS_LOGO_BASE = '/brand/logo/variants'

export function businessLensLogoSrc(variant: BusinessLensLogoVariant, dark = false) {
  return `${BUSINESSLENS_LOGO_BASE}/${variant.file}${dark ? '-dark' : ''}.svg`
}

export function findBusinessLensLogo<T extends BusinessLensLogoVariant>(
  list: T[],
  id: string | null | undefined,
  fallback: string
): T {
  return list.find(item => item.id === id) ?? list.find(item => item.id === fallback)!
}
