import { cpSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { lintModel } from '../src/commands/lint.js'
import { loadModel } from '../src/core/model.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')
const TRACKED = [
  'README.md',
  'src/routes/storefront.ts', 'src/routes/admin.ts',
  'src/services/catalog.ts', 'src/services/orders.ts', 'src/services/payments.ts',
  'src/models/product.ts', 'src/models/order.ts'
]

let dir: string | undefined
function fixtureCopy(): string {
  dir = mkdtempSync(join(tmpdir(), 'bl-lint-'))
  cpSync(FIXTURE, dir, { recursive: true })
  return dir
}

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
  dir = undefined
})

function run(cwd: string, tracked = TRACKED) {
  return lintModel(loadModel(cwd), tracked)
}

describe('lintModel', () => {
  it('passes the golden fixture', () => {
    const result = run(fixtureCopy())
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
    expect(result.counts).toEqual({
      actors: 2,
      experiences: 2,
      domains: 2,
      features: 3,
      journeys: 2,
      scenarios: 3,
      businessRules: 2
    })
  })

  it('ignores a stale platform block rather than failing', () => {
    const cwd = fixtureCopy()
    writeFileSync(
      join(cwd, '.businesslens/config.yaml'),
      'schema: 1\nplatform:\n  url: https://attacker.example\nsdd:\n  paths: []\n'
    )
    expect(run(cwd).errors).toEqual([])
  })

  it('rejects product ids longer than 64 characters', () => {
    const cwd = fixtureCopy()
    const product = join(cwd, '.businesslens/product.md')
    writeFileSync(product, readFileSync(product, 'utf8').replace('id: fixture-shop', `id: ${'a'.repeat(65)}`))
    expect(run(cwd).errors).toContain('product.md: id must be at most 64 characters')
  })

  it('fails on dangling relations and missing required relationships', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/journeys/browse-and-buy/journey.md'), `---
domain: ordering
actors: [ghost]
experiences: []
features: [checkout]
---

# Browse and buy

Lead.
`)
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('missing actor "ghost"')
    expect(errors).toContain('at least one experience')
  })

  it('fails when a present codeRef points at an untracked file', () => {
    const result = run(fixtureCopy(), TRACKED.filter(file => file !== 'src/services/payments.ts'))
    expect(result.errors.some(error => error.includes('src/services/payments.ts'))).toBe(true)
  })

  it('allows missing codeRefs at every coverage status', () => {
    for (const status of ['draft', 'partial', 'complete']) {
      const cwd = fixtureCopy()
      writeFileSync(join(cwd, '.businesslens/coverage.md'), `---
status: ${status}
method: ["Authored model"]
sourceAreas: []
unmapped: []
limitations: []
---

# Coverage

Model breadth.
`)
      const journeyFile = join(cwd, '.businesslens/journeys/manage-orders/journey.md')
      const scenarioFile = join(cwd, '.businesslens/journeys/manage-orders/scenarios/refund-order.md')
      writeFileSync(journeyFile, readFileSync(journeyFile, 'utf8').replace(/codeRefs:\n(?:  - .*\n)+/, ''))
      writeFileSync(scenarioFile, readFileSync(scenarioFile, 'utf8').replace(/codeRefs:\n(?:  - .*\n)+/, ''))
      const result = run(cwd)
      expect(result.errors, status).toEqual([])
      expect(result.warnings.some(warning => warning.includes('codeRef')), status).toBe(false)
      rmSync(cwd, { recursive: true, force: true })
      dir = undefined
    }
  })

  it('fails on duplicate scenario ids across journeys', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/journeys/manage-orders/scenarios/browse-catalog.md'), `---
kind: primary
---

# Duplicate

## Trigger

t.

## Steps

1. s

## Outcome

o.
`)
    expect(run(cwd).errors.some(error => error.includes('already used'))).toBe(true)
  })

  it('fails on a bad access mode', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/experiences/storefront.md'), `---
actors: [shopper]
access: secret
---

# Storefront

Lead.
`)
    expect(run(cwd).errors.some(error => error.includes('access "secret"'))).toBe(true)
  })

  it('fails when a journey loses all scenarios', () => {
    const cwd = fixtureCopy()
    unlinkSync(join(cwd, '.businesslens/journeys/manage-orders/scenarios/refund-order.md'))
    expect(run(cwd).errors.some(error => error.includes('at least one scenario'))).toBe(true)
  })

  it('warns on dangling links without failing', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/actors/shopper.md'), `---
links:
  - rel: doc
    href: docs/missing.md
---

# Shopper

Lead.
`)
    const result = run(cwd)
    expect(result.ok).toBe(true)
    expect(result.warnings.some(warning => warning.includes('docs/missing.md'))).toBe(true)
  })

  it('rejects unknown frontmatter keys', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/domains/catalog.md'), `---
color: 3
---

# Catalog

Lead.
`)
    expect(run(cwd).errors.some(error => error.includes('unknown frontmatter key "color"'))).toBe(true)
  })
})
