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
      interfaces: 3,
      experiences: 2,
      screens: 1,
      domains: 2,
      capabilities: 3,
      journeys: 2,
      scenarios: 3,
      businessRules: 2
    })
  })

  it('rejects historical folder schemas', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/config.yaml'), 'schema: 2\nsdd:\n  paths: []\n')
    expect(run(cwd).errors).toContain('config.yaml: schema 2 is not supported (expected 3)')
  })

  it('rejects unsupported future folder schemas explicitly', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/config.yaml'), 'schema: 99\nsdd:\n  paths: []\n')
    expect(run(cwd).errors).toContain('config.yaml: schema 99 is not supported (expected 3)')
  })

  it('rejects the removed Feature collection explicitly', () => {
    const cwd = fixtureCopy()
    cpSync(join(cwd, '.businesslens/capabilities'), join(cwd, '.businesslens/features'), { recursive: true })
    expect(run(cwd).errors).toContain('features/: unsupported schema 2 collection; use capabilities/ with schema 3')
  })

  it('requires the committed orientation and generated-path ignores', () => {
    const cwd = fixtureCopy()
    unlinkSync(join(cwd, '.businesslens/README.md'))
    writeFileSync(join(cwd, '.businesslens/.gitignore'), 'build/\n')
    const errors = run(cwd).errors
    expect(errors).toContain('README.md is missing')
    expect(errors).toContain('.gitignore must ignore cache/')
  })

  it('requires the model gitignore file', () => {
    const cwd = fixtureCopy()
    unlinkSync(join(cwd, '.businesslens/.gitignore'))
    expect(run(cwd).errors).toContain('.gitignore is missing')
  })

  it('requires both Actor classifications', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/actors/shopper.md'), `# Shopper

A visitor who browses and buys.
`)
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('kind "" must be person|system')
    expect(errors).toContain('relationship "" must be external|internal')
  })

  it('supports all person/system and internal/external Actor combinations', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/actors/partner-system.md'), `---
kind: system
relationship: external
---

# Partner system

An external system that uses a supported integration.
`)
    writeFileSync(join(cwd, '.businesslens/actors/store-scheduler.md'), `---
kind: system
relationship: internal
---

# Store scheduler

An internal system that initiates store operations.
`)
    expect(run(cwd).errors).toEqual([])
  })

  it('allows Products with no Domains and no Screens', () => {
    const cwd = fixtureCopy()
    rmSync(join(cwd, '.businesslens/domains'), { recursive: true })
    rmSync(join(cwd, '.businesslens/screens'), { recursive: true })
    for (const name of ['catalog-browsing', 'checkout', 'order-management']) {
      const file = join(cwd, `.businesslens/capabilities/${name}.md`)
      writeFileSync(file, readFileSync(file, 'utf8').replace(/^domain: .*\n/m, ''))
    }
    for (const name of ['payment-before-confirmation', 'refund-existing-orders']) {
      const file = join(cwd, `.businesslens/business-rules/${name}.md`)
      writeFileSync(file, readFileSync(file, 'utf8').replace(/^domains: .*\n/m, ''))
    }
    const result = run(cwd)
    expect(result.errors).toEqual([])
    expect(result.counts.domains).toBe(0)
    expect(result.counts.screens).toBe(0)
  })

  it('supports a non-visual CLI Interface alongside visual Interfaces', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/interfaces/operator-cli.md'), `---
actors: [store-admin]
entryPoints:
  - cli: fixture-shop orders
---

# Operator CLI

The supported command interface for store operators.

## Capability boundary

Supports order administration without customer shopping.
`)
    const experience = join(cwd, '.businesslens/experiences/admin-console.md')
    writeFileSync(
      experience,
      readFileSync(experience, 'utf8')
        .replace('interfaces: [admin-web]', 'interfaces: [admin-web, operator-cli]')
        .replace('  - admin-web: /admin', '  - admin-web: /admin\n  - operator-cli: fixture-shop orders')
    )
    for (const relative of [
      '.businesslens/capabilities/order-management.md',
      '.businesslens/journeys/manage-orders/journey.md'
    ]) {
      const file = join(cwd, relative)
      writeFileSync(
        file,
        readFileSync(file, 'utf8').replace(
          'availability:\n  - interface: admin-web\n    experiences: [admin-console]',
          'availability:\n  - interface: admin-web\n    experiences: [admin-console]\n  - interface: operator-cli\n    experiences: [admin-console]'
        )
      )
    }
    expect(run(cwd).errors).toEqual([])
  })

  it('checks Interface audiences and Interface-keyed Experience entry points', () => {
    const cwd = fixtureCopy()
    const productInterface = join(cwd, '.businesslens/interfaces/customer-web.md')
    writeFileSync(productInterface, readFileSync(productInterface, 'utf8').replace('actors: [shopper]', 'actors: [store-admin]'))
    const experience = join(cwd, '.businesslens/experiences/storefront.md')
    writeFileSync(experience, readFileSync(experience, 'utf8').replace('  - customer-web: /', '  - missing-interface: /'))
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('actor "shopper" is not supported by interface "customer-web"')
    expect(errors).toContain('entry point references undeclared interface "missing-interface"')
  })

  it('rejects duplicate availability and Capability placement gaps', () => {
    const cwd = fixtureCopy()
    const capability = join(cwd, '.businesslens/capabilities/checkout.md')
    writeFileSync(
      capability,
      readFileSync(capability, 'utf8')
        .replace('  - interface: customer-mobile\n    experiences: [storefront]\n', '')
        .replace(
          '  - interface: customer-web\n    experiences: [storefront]',
          '  - interface: customer-web\n    experiences: [storefront, storefront]\n  - interface: customer-web\n    experiences: [storefront]'
        )
    )
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('duplicate availability interface "customer-web"')
    expect(errors).toContain('duplicate availability experience "storefront" for interface "customer-web"')
    expect(errors).toContain('capability "checkout" is not available in "customer-mobile/storefront"')
  })

  it('allows Scenario availability only as a Journey subset', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/complete-checkout.md')
    writeFileSync(
      scenario,
      readFileSync(scenario, 'utf8').replace(
        'kind: primary',
        'kind: primary\navailability:\n  - interface: admin-web\n    experiences: [admin-console]'
      )
    )
    expect(run(cwd).errors.join('\n'))
      .toContain('availability "admin-web/admin-console" is outside journey "browse-and-buy"')
  })

  it('rejects removed Experience and Journey fields as unknown keys', () => {
    const cwd = fixtureCopy()
    const experience = join(cwd, '.businesslens/experiences/storefront.md')
    writeFileSync(experience, readFileSync(experience, 'utf8').replace('access: public', 'access: public\nexit: done'))
    const journey = join(cwd, '.businesslens/journeys/browse-and-buy/journey.md')
    writeFileSync(journey, readFileSync(journey, 'utf8').replace('actors:', 'domain: ordering\nactors:'))
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('unknown frontmatter key "exit"')
    expect(errors).toContain('unknown frontmatter key "domain"')
  })

  it('validates Screen relationships and product content', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/screens/product-record.md'), `---
availability:
  - interface: missing-interface
    experiences: [missing-experience]
capabilities: []
scenarios: [missing-scenario]
---

# Product record

Lead.

## Information presented

No bullet.

## Product states

### Empty

## Capability boundary
`)
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('references missing experience "missing-experience"')
    expect(errors).toContain('references missing interface "missing-interface"')
    expect(errors).toContain('needs at least one capability')
    expect(errors).toContain('references missing scenario "missing-scenario"')
    expect(errors).toContain('"## Information presented" needs at least one bullet item')
    expect(errors).toContain('product state "Empty" needs a description')
    expect(errors).toContain('missing "## Capability boundary" section')
  })

  it('rejects unknown config keys', () => {
    const cwd = fixtureCopy()
    writeFileSync(
      join(cwd, '.businesslens/config.yaml'),
      'schema: 3\nplatform:\n  url: https://attacker.example\nsdd:\n  paths: []\n'
    )
    expect(run(cwd).errors).toContain('config.yaml: unknown key "platform"')
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
actors: [ghost]
capabilities: [checkout]
availability:
  - interface: customer-web
    experiences: [missing-experience]
---

# Browse and buy

Lead.
`)
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('missing actor "ghost"')
    expect(errors).toContain('references missing experience "missing-experience"')
  })

  it('fails when a code reference points at an untracked file', () => {
    const result = run(fixtureCopy(), TRACKED.filter(file => file !== 'src/services/payments.ts'))
    expect(result.errors.some(error => error.includes('src/services/payments.ts'))).toBe(true)
  })

  it('allows missing references at every coverage status', () => {
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
      const referenceBlock = /references:\n(?:  - kind: .*\n    role: .*\n    target: .*\n)+/
      writeFileSync(journeyFile, readFileSync(journeyFile, 'utf8').replace(referenceBlock, ''))
      writeFileSync(scenarioFile, readFileSync(scenarioFile, 'utf8').replace(referenceBlock, ''))
      const result = run(cwd)
      expect(result.errors, status).toEqual([])
      expect(result.warnings.some(warning => warning.includes('reference')), status).toBe(false)
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
interfaces: [customer-web]
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

  it('warns on a missing repository-relative reference without failing', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/actors/shopper.md'), `---
kind: person
relationship: external
references:
  - kind: doc
    role: context
    target: docs/missing.md
---

# Shopper

Lead.
`)
    const result = run(cwd)
    expect(result.ok).toBe(true)
    expect(result.warnings.some(warning => warning.includes('docs/missing.md'))).toBe(true)
  })

  it('checks the local path behind a reference query or fragment', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/actors/shopper.md'), `---
kind: person
relationship: external
references:
  - kind: research
    role: context
    target: README.md?plain=1#method
---

# Shopper

Lead.
`)
    const result = run(cwd)
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('rejects unsafe supporting-reference schemes', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/actors/shopper.md'), `---
kind: person
relationship: external
references:
  - kind: visual
    role: intent
    target: file:///tmp/screen.png
---

# Shopper

Lead.
`)
    expect(run(cwd).errors.join('\n')).toContain('must use HTTP(S) or a repository-relative path')
  })

  it('rejects duplicate reference targets on one entity', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/actors/shopper.md'), `---
kind: person
relationship: external
references:
  - kind: doc
    role: context
    target: https://example.com/same
  - kind: visual
    role: intent
    target: https://example.com/same
---

# Shopper

Lead.
`)
    expect(run(cwd).errors.join('\n')).toContain('duplicate reference target')
  })

  it('allows references on Product but not Coverage', () => {
    const cwd = fixtureCopy()
    const product = join(cwd, '.businesslens/product.md')
    writeFileSync(product, readFileSync(product, 'utf8').replace(
      'limitations: []',
      'limitations: []\nreferences:\n  - kind: proposal\n    role: intent\n    target: https://example.com/product-direction'
    ))
    expect(run(cwd).errors).toEqual([])

    const coverage = join(cwd, '.businesslens/coverage.md')
    writeFileSync(coverage, readFileSync(coverage, 'utf8').replace(
      'limitations:',
      'references: []\nlimitations:'
    ))
    expect(run(cwd).errors.join('\n')).toContain('coverage.md: unknown frontmatter key "references"')
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
