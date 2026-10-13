import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const pddKitRoot = dirname(createRequire(import.meta.url).resolve('@itai-gendler/pdd-kit/package.json'))
const theme = resolve(pddKitRoot, 'layers/nuxt/theme')

const ICON_SET = [
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

describe('approved pdd-kit identity', () => {
  it('ships one light/dark mark and wordmark from the stable theme', () => {
    for (const file of ['mark.svg', 'mark-dark.svg', 'wordmark.svg', 'wordmark-dark.svg']) {
      expect(existsSync(resolve(theme, 'public/brand/logo', file)), file).toBe(true)
    }

    const brand = readFileSync(resolve(theme, 'app/components/PddKitBrand.vue'), 'utf8')
    expect(brand).toContain('const BRAND_BASE = \'/brand/logo\'')
    expect(brand).not.toMatch(/variant|usePddKitLogoVariant/i)
  })

  it('ships one complete stable browser and install icon family', () => {
    for (const name of ICON_SET) {
      expect(
        existsSync(resolve(theme, 'public/brand/icons', name)),
        `${name} is missing — run npm run theme:icons in itai-gendler/pdd-kit`
      ).toBe(true)
    }
    expect(existsSync(resolve(theme, 'public/favicon.ico'))).toBe(true)
    expect(existsSync(resolve(theme, 'public/site.webmanifest'))).toBe(true)

    const manifest = JSON.parse(readFileSync(resolve(theme, 'public/site.webmanifest'), 'utf8'))
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith('/brand/icons/')).toBe(true)
      expect(icon.src).not.toContain('/marks/')
    }
  })
})
