import { cpSync, mkdtempSync, rmSync, writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadModel } from '../src/core/model.js'
import { validateModel } from '../src/commands/validate.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')

const TRACKED = [
  'README.md',
  'src/routes/storefront.ts', 'src/routes/admin.ts',
  'src/services/catalog.ts', 'src/services/orders.ts', 'src/services/payments.ts',
  'src/models/product.ts', 'src/models/order.ts'
]

let dir: string | undefined
function fixtureCopy(): string {
  dir = mkdtempSync(join(tmpdir(), 'bl-validate-'))
  cpSync(FIXTURE, dir, { recursive: true })
  return dir
}
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
  dir = undefined
})

function run(cwd: string, tracked = TRACKED) {
  return validateModel(loadModel(cwd), tracked)
}

describe('validateModel', () => {
  it('passes the golden fixture', () => {
    const result = run(fixtureCopy())
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
    expect(result.counts).toEqual({ actors: 2, experiences: 2, domains: 2, journeys: 2, scenarios: 3 })
  })

  it('rejects an untrusted configured platform URL', () => {
    const cwd = fixtureCopy()
    writeFileSync(
      join(cwd, '.businesslens/config.yaml'),
      'schema: 1\nplatform:\n  url: https://attacker.example\nsdd:\n  paths: []\n'
    )
    const result = run(cwd)
    expect(result.errors).toContainEqual(expect.stringContaining('untrusted platform.url'))
  })

  it('fails on a dangling actor reference', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/journeys/browse-and-buy/journey.md'), `---
domain: ordering
actors: [ghost]
experiences: [storefront]
codeRefs: [src/services/orders.ts]
---

# Browse and buy

Lead.
`)
    const result = run(cwd)
    expect(result.errors.some(error => error.includes('missing actor "ghost"'))).toBe(true)
  })

  it('fails when a journey has no experience', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/journeys/browse-and-buy/journey.md'), `---
domain: ordering
actors: [shopper]
experiences: []
codeRefs: [src/services/orders.ts]
---

# Browse and buy

Lead.
`)
    const result = run(cwd)
    expect(result.errors.some(error => error.includes('at least one experience'))).toBe(true)
  })

  it('fails when a codeRef points at an untracked file', () => {
    const result = run(fixtureCopy(), TRACKED.filter(file => file !== 'src/services/payments.ts'))
    expect(result.errors.some(error => error.includes('src/services/payments.ts'))).toBe(true)
  })

  it('fails on duplicate scenario ids across journeys', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/journeys/manage-orders/scenarios/browse-catalog.md'), `---
kind: primary
codeRefs: [src/services/orders.ts]
---

# Duplicate

## Trigger

t.

## Steps

1. s

## Outcome

o.
`)
    const result = run(cwd)
    expect(result.errors.some(error => error.includes('already used'))).toBe(true)
  })

  it('fails on an unknown scenario kind and a bad access mode', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/experiences/storefront.md'), `---
actors: [shopper]
access: secret
---

# Storefront

Lead.
`)
    const result = run(cwd)
    expect(result.errors.some(error => error.includes('access "secret"'))).toBe(true)
  })

  it('fails when a journey loses all scenarios', () => {
    const cwd = fixtureCopy()
    unlinkSync(join(cwd, '.businesslens/journeys/manage-orders/scenarios/refund-order.md'))
    const result = run(cwd)
    expect(result.errors.some(error => error.includes('at least one scenario'))).toBe(true)
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
    const result = run(cwd)
    expect(result.errors.some(error => error.includes('unknown frontmatter key "color"'))).toBe(true)
  })

  it('downgrades missing evidence to warnings while coverage status is draft', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/coverage.md'), `---
status: draft
method: ["Planned before implementation"]
sourceAreas: []
unmapped: []
limitations: []
---

# Coverage

Planned map.
`)
    writeFileSync(join(cwd, '.businesslens/journeys/manage-orders/journey.md'), `---
domain: ordering
actors: [store-admin]
experiences: [admin-console]
---

# Manage orders

An admin reviews and refunds orders.
`)
    writeFileSync(join(cwd, '.businesslens/journeys/manage-orders/scenarios/refund-order.md'), `---
kind: edge
---

# Refund an order

## Trigger

t.

## Steps

1. s

## Outcome

o.
`)
    const result = run(cwd)
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
    expect(result.warnings.filter(warning => warning.includes('needs at least one codeRef'))).toHaveLength(2)
  })

  it('keeps missing evidence an error once coverage leaves draft', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/journeys/manage-orders/journey.md'), `---
domain: ordering
actors: [store-admin]
experiences: [admin-console]
---

# Manage orders

An admin reviews and refunds orders.
`)
    const result = run(cwd)
    expect(result.ok).toBe(false)
    expect(result.errors.some(error => error.includes('needs at least one codeRef'))).toBe(true)
  })
})
