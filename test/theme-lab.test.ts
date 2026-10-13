import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  PDD_KIT_DARK_BACKGROUNDS,
  PDD_KIT_DEFAULT_DARK_BACKGROUND,
  PDD_KIT_DEFAULT_LIGHT_BACKGROUND,
  PDD_KIT_LIGHT_BACKGROUNDS
} from '../layers/nuxt/theme-lab/app/utils/pddKitThemeLabVariants.js'

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
  'pdd-kit-app-icon.svg',
  'pdd-kit-maskable-icon.svg',
  'icon-1024.png'
]

describe('shared pdd-kit theme lab', () => {
  it('keeps only the undecided background selections', () => {
    expect(PDD_KIT_LIGHT_BACKGROUNDS.find(item => item.id === PDD_KIT_DEFAULT_LIGHT_BACKGROUND)?.name)
      .toBe('Glow')
    expect(PDD_KIT_DARK_BACKGROUNDS.find(item => item.id === PDD_KIT_DEFAULT_DARK_BACKGROUND)?.name)
      .toBe('Espresso')

    const variants = readFileSync(join(layer, 'app/utils/pddKitThemeLabVariants.ts'), 'utf8')
    expect(variants).not.toMatch(/mark|lockup|favicon|logo/i)
  })

  it('owns the approved identity and complete icon family in the stable theme', () => {
    for (const file of ['mark.svg', 'mark-dark.svg', 'tab.svg', 'tab-dark.svg', 'wordmark.svg', 'wordmark-dark.svg', 'lockup.svg', 'lockup-dark.svg']) {
      expect(existsSync(join(theme, 'public/brand/logo', file)), file).toBe(true)
    }
    for (const file of iconFiles) {
      expect(existsSync(join(theme, 'public/brand/icons', file)), file).toBe(true)
    }
    expect(existsSync(join(theme, 'public/favicon.ico'))).toBe(true)
    expect(existsSync(join(theme, 'public/site.webmanifest'))).toBe(true)

    const brand = readFileSync(join(theme, 'app/components/PddKitBrand.vue'), 'utf8')
    expect(brand).toContain("const BRAND_BASE = '/brand/logo'")
    expect(brand).not.toMatch(/variant|usePddKitLogoVariant/i)

    const manifest = JSON.parse(readFileSync(join(theme, 'public/site.webmanifest'), 'utf8'))
    for (const icon of manifest.icons) {
      expect(icon.src).toMatch(/^\/brand\/icons\//)
      expect(icon.src).not.toContain('/marks/')
    }
  })

  it('contains no logo, lockup, or favicon experiment implementation', () => {
    expect(existsSync(join(layer, 'public'))).toBe(false)
    expect(existsSync(join(layer, 'app/components/PddKitBrand.vue'))).toBe(false)
    expect(existsSync(join(layer, 'app/components/PddKitThemeLabLogoRow.vue'))).toBe(false)
    expect(existsSync(join(layer, 'app/composables/usePddKitLogoVariant.ts'))).toBe(false)
    expect(existsSync(join(layer, 'app/utils/pddKitThemeLabMarks.mjs'))).toBe(false)

    const head = readFileSync(join(layer, 'app/composables/usePddKitThemeLabHead.ts'), 'utf8')
    const bar = readFileSync(join(layer, 'app/components/PddKitThemeLabBar.vue'), 'utf8')
    expect(head).not.toMatch(/icon|manifest|mark/i)
    expect(bar).not.toContain('PddKitThemeLabLogoRow')
    expect(bar).toContain('rowCount?: 1 | 2 | 3 | 4 | 5')
    expect(bar).toContain('rowCount: 1')
  })

  it('keeps the local viewer on the shared theme lab background flow', () => {
    const config = readFileSync(join(root, 'viewer/app/nuxt.config.ts'), 'utf8')
    const localViewer = readFileSync(join(root, 'viewer/app/app/app.vue'), 'utf8')
    const localPage = readFileSync(join(root, 'viewer/app/app/pages/index.vue'), 'utf8')
    const localCss = readFileSync(join(root, 'viewer/app/app/assets/local-viewer.css'), 'utf8')
    /* The private viewer lab extends the stable report layer and may add its
       own audition row. The background lab remains the second layer. */
    const reportLayer = config.indexOf("resolve('../../layers/nuxt/report-viewer-lab')")
    const themeLabLayer = config.indexOf("resolve('../../layers/nuxt/theme-lab')")
    const labConfig = readFileSync(join(root, 'layers/nuxt/report-viewer-lab/nuxt.config.ts'), 'utf8')

    expect(reportLayer).toBeGreaterThan(-1)
    expect(themeLabLayer).toBeGreaterThan(reportLayer)
    expect(labConfig).toContain("join(currentDir, '../report-viewer')")
    expect(localViewer).toContain('usePddKitThemeHead()')
    expect(localViewer).toContain('usePddKitThemeLabHead()')
    expect(readFileSync(join(root, 'viewer/app/app/components/LocalViewerBrand.vue'), 'utf8')).toContain('usePddKitThemeLab()')
    expect(localViewer).toMatch(/<PddKitThemeLabBar(?:\s|>)/)
    expect(localViewer).not.toContain('<UHeader')
    expect(localViewer).toContain('var(--pdd-kit-theme-lab-height)')
    expect(localViewer).toContain('class="flex h-dvh flex-col overflow-hidden"')
    expect(localViewer).toContain('class="pdd-kit-page-surface min-h-0 flex-1 overflow-hidden"')
    expect(localViewer).not.toContain('<footer')
    expect(localPage).toContain('class="pdd-kit-local-report min-h-0 flex-1"')
    expect(localCss).toContain('.pdd-kit-report.pdd-kit-local-report')
  })

  it('styles the pdd-kit classes the components use, as class selectors', () => {
    // A rename once turned the report's class selector into the element
    // selector `product-model-report`, which matches nothing: graphs lost their height.
    const css = [
      'layers/nuxt/report-viewer/app/assets/report-structure.css',
      'layers/nuxt/report-viewer/app/assets/report-topology.css',
      'layers/nuxt/report-viewer/app/assets/report-viewer.css',
      'layers/nuxt/theme/app/assets/theme.css',
      'layers/nuxt/theme-lab/app/assets/theme-lab.css',
      'viewer/app/app/assets/local-viewer.css'
    ].map(file => readFileSync(join(root, file), 'utf8')).join('\n')
    expect(css).not.toMatch(/(^|[\s,(])product-model-[a-z-]+\s*[{,)]/m)
    for (const selector of ['.pdd-kit-report {', '.pdd-kit-report .report-product-topology', '.pdd-kit-neutral-badge {', '.pdd-kit-page-surface {']) {
      expect(css).toContain(selector)
    }
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
