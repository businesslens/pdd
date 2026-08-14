import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  BUSINESSLENS_DARK_BACKGROUNDS,
  BUSINESSLENS_DEFAULT_DARK_BACKGROUND,
  BUSINESSLENS_DEFAULT_LIGHT_BACKGROUND,
  BUSINESSLENS_LIGHT_BACKGROUNDS
} from '../layers/nuxt/theme-lab/app/utils/businesslensThemeLabVariants.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const layer = join(root, 'layers/nuxt/theme-lab')
const theme = join(root, 'layers/nuxt/theme')

const iconFiles = [
  'favicon.svg',
  'favicon.ico',
  'favicon-32.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'maskable-icon-512.png',
  'businesslens-app-icon.svg',
  'businesslens-maskable-icon.svg',
  'icon-1024.png'
]

describe('shared BusinessLens theme lab', () => {
  it('keeps only the undecided background selections', () => {
    expect(BUSINESSLENS_LIGHT_BACKGROUNDS.find(item => item.id === BUSINESSLENS_DEFAULT_LIGHT_BACKGROUND)?.name)
      .toBe('Glow')
    expect(BUSINESSLENS_DARK_BACKGROUNDS.find(item => item.id === BUSINESSLENS_DEFAULT_DARK_BACKGROUND)?.name)
      .toBe('Espresso')

    const variants = readFileSync(join(layer, 'app/utils/businesslensThemeLabVariants.ts'), 'utf8')
    expect(variants).not.toMatch(/mark|lockup|favicon|logo/i)
  })

  it('owns the approved identity and complete icon family in the stable theme', () => {
    for (const file of ['mark.svg', 'mark-dark.svg', 'wordmark.svg', 'wordmark-dark.svg']) {
      expect(existsSync(join(theme, 'public/brand/logo', file)), file).toBe(true)
    }
    for (const file of iconFiles) {
      expect(existsSync(join(theme, 'public/brand/icons', file)), file).toBe(true)
    }
    expect(existsSync(join(theme, 'public/favicon.ico'))).toBe(true)
    expect(existsSync(join(theme, 'public/site.webmanifest'))).toBe(true)

    const brand = readFileSync(join(theme, 'app/components/BusinessLensBrand.vue'), 'utf8')
    expect(brand).toContain("const BRAND_BASE = '/brand/logo'")
    expect(brand).not.toMatch(/variant|useBusinessLensLogoVariant/i)

    const manifest = JSON.parse(readFileSync(join(theme, 'public/site.webmanifest'), 'utf8'))
    for (const icon of manifest.icons) {
      expect(icon.src).toMatch(/^\/brand\/icons\//)
      expect(icon.src).not.toContain('/marks/')
    }
  })

  it('contains no logo, lockup, or favicon experiment implementation', () => {
    expect(existsSync(join(layer, 'public'))).toBe(false)
    expect(existsSync(join(layer, 'app/components/BusinessLensBrand.vue'))).toBe(false)
    expect(existsSync(join(layer, 'app/components/BusinessLensThemeLabLogoRow.vue'))).toBe(false)
    expect(existsSync(join(layer, 'app/composables/useBusinessLensLogoVariant.ts'))).toBe(false)
    expect(existsSync(join(layer, 'app/utils/businesslensThemeLabMarks.mjs'))).toBe(false)

    const head = readFileSync(join(layer, 'app/composables/useBusinessLensThemeLabHead.ts'), 'utf8')
    const bar = readFileSync(join(layer, 'app/components/BusinessLensThemeLabBar.vue'), 'utf8')
    expect(head).not.toMatch(/icon|manifest|mark/i)
    expect(bar).not.toContain('BusinessLensThemeLabLogoRow')
    expect(bar).toContain('rowCount?: 1 | 2 | 3 | 4 | 5')
    expect(bar).toContain('rowCount: 1')
  })

  it('keeps the local viewer on the shared landing-page background flow', () => {
    const config = readFileSync(join(root, 'viewer/app/nuxt.config.ts'), 'utf8')
    const localViewer = readFileSync(join(root, 'viewer/app/app/app.vue'), 'utf8')
    /* The report layer arrives through `workbench-lab`, which extends it and adds
       the alternative readings. What matters here is unchanged: the report
       layer comes first, and the theme lab comes after it. */
    const reportLayer = config.indexOf("resolve('../../layers/nuxt/workbench-lab')")
    const themeLabLayer = config.indexOf("resolve('../../layers/nuxt/theme-lab')")
    const labConfig = readFileSync(join(root, 'layers/nuxt/workbench-lab/nuxt.config.ts'), 'utf8')

    expect(reportLayer).toBeGreaterThan(-1)
    expect(themeLabLayer).toBeGreaterThan(reportLayer)
    expect(labConfig).toContain("join(currentDir, '../report-viewer')")
    expect(localViewer).toContain('useBusinessLensThemeHead()')
    expect(localViewer).toContain('useBusinessLensThemeLabHead()')
    expect(localViewer).toContain('useBusinessLensThemeLab()')
    expect(localViewer).toContain('<BusinessLensThemeLabBar')
    expect(localViewer).toContain('top-(--businesslens-theme-lab-height)')
    expect(localViewer).toContain('var(--businesslens-theme-lab-height)')
  })

  it('keeps stable dark tokens and the flat Espresso audition distinct', () => {
    const stableCss = readFileSync(join(theme, 'app/assets/theme.css'), 'utf8')
    const labCss = readFileSync(join(layer, 'app/assets/theme-lab.css'), 'utf8')
    const dark = stableCss.match(/\.dark \{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(dark).toContain('--ui-border:')
    expect(dark).toContain('--ui-border-muted:')
    expect(dark).toContain('--ui-border-accented:')
    expect(labCss).toMatch(
      /:root\[data-bg-dark="d1"\]\.dark body \{\s*background-image: none;/
    )
  })
})
