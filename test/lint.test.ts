import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
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
      interfaces: 4,
      experiences: 2,
      screens: 1,
      domains: 2,
      capabilities: 3,
      capabilityScenarios: 4,
      journeys: 1,
      journeyScenarios: 2,
      businessRules: 2
    })
  })

  it('rejects historical folder schemas', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/config.yaml'), 'schema: 2\nsdd:\n  paths: []\n')
    expect(run(cwd).errors).toContain('config.yaml: schema 2 is not supported (expected 4)')
  })

  it('rejects unsupported future folder schemas explicitly', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/config.yaml'), 'schema: 99\nsdd:\n  paths: []\n')
    expect(run(cwd).errors).toContain('config.yaml: schema 99 is not supported (expected 4)')
  })

  it('rejects the removed Feature collection explicitly', () => {
    const cwd = fixtureCopy()
    cpSync(join(cwd, '.businesslens/capabilities'), join(cwd, '.businesslens/features'), { recursive: true })
    expect(run(cwd).errors).toContain('features/: unsupported schema 2 collection; use capabilities/ with schema 4')
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

  it('allows direct Interface availability when the Product has no Experiences', () => {
    const cwd = fixtureCopy()
    rmSync(join(cwd, '.businesslens/experiences'), { recursive: true })
    for (const collection of [
      'capabilities',
      'business-rules',
      'screens',
      'capability-scenarios',
      'journey-scenarios'
    ]) {
      for (const name of readdirSync(join(cwd, `.businesslens/${collection}`))) {
        const file = join(cwd, `.businesslens/${collection}/${name}`)
        writeFileSync(file, readFileSync(file, 'utf8')
          .replace(/^[ \t]+experiences: .*\n/gm, '')
          .replace(/^[ \t]+experience: .*\n/gm, ''))
      }
    }

    const result = run(cwd)
    expect(result.errors).toEqual([])
    expect(result.counts.experiences).toBe(0)
  })

  it('requires Experience scope when an Interface declares Experiences', () => {
    const cwd = fixtureCopy()
    const capability = join(cwd, '.businesslens/capabilities/checkout.md')
    writeFileSync(
      capability,
      readFileSync(capability, 'utf8').replace('    experiences: [storefront]\n', '')
    )
    expect(run(cwd).errors.join('\n')).toContain(
      'availability for interface "customer-web" needs at least one experience because the interface uses Experience contexts'
    )
  })

  it('rejects an explicit empty Experience list instead of treating it as direct availability', () => {
    const cwd = fixtureCopy()
    const capability = join(cwd, '.businesslens/capabilities/checkout.md')
    writeFileSync(
      capability,
      readFileSync(capability, 'utf8').replace('experiences: [storefront]', 'experiences: []')
    )
    expect(run(cwd).errors.join('\n')).toContain(
      'optional non-empty "experiences" string list'
    )
  })

  /*
    The fixture ships `operator-cli` with direct availability. Scoping it into
    an Experience here keeps both shapes covered: a non-visual Interface works
    whether or not Experiences divide it.
  */
  it('supports a non-visual CLI Interface alongside visual Interfaces', () => {
    const cwd = fixtureCopy()
    const experience = join(cwd, '.businesslens/experiences/admin-console.md')
    writeFileSync(
      experience,
      readFileSync(experience, 'utf8')
        .replace('interfaces: [admin-web]', 'interfaces: [admin-web, operator-cli]')
        .replace('  - admin-web: /admin', '  - admin-web: /admin\n  - operator-cli: fixture-shop orders')
    )
    for (const relative of [
      '.businesslens/capabilities/order-management.md',
      '.businesslens/capability-scenarios/refund-order.md'
    ]) {
      const file = join(cwd, relative)
      writeFileSync(
        file,
        readFileSync(file, 'utf8').replace(
          '  - interface: operator-cli\n',
          '  - interface: operator-cli\n    experiences: [admin-console]\n'
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

  it('requires Experiences to cover every Actor of an Interface they divide', () => {
    const cwd = fixtureCopy()
    const productInterface = join(cwd, '.businesslens/interfaces/customer-web.md')
    writeFileSync(
      productInterface,
      readFileSync(productInterface, 'utf8').replace('actors: [shopper]', 'actors: [shopper, store-admin]')
    )

    expect(run(cwd).errors.join('\n')).toContain(
      'actor "store-admin" is not covered by any Experience declaring this interface'
    )
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
    expect(errors).toContain('availability "customer-mobile/storefront" is outside capability "checkout"')
  })

  it('requires Capability Scenario availability to be a Capability subset', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/capability-scenarios/complete-checkout.md')
    writeFileSync(
      scenario,
      readFileSync(scenario, 'utf8').replace(
        '  - interface: customer-web\n    experiences: [storefront]',
        '  - interface: admin-web\n    experiences: [admin-console]'
      )
    )
    expect(run(cwd).errors.join('\n'))
      .toContain('availability "admin-web/admin-console" is outside capability "checkout"')
  })

  it('requires every Scenario Actor to participate in a selected exact context', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/capability-scenarios/refund-order.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace(
      'actors: [store-admin]',
      'actors: [shopper]'
    ))
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('context "admin-web/admin-console" permits none of the Scenario Actors')
    expect(errors).toContain('actor "shopper" is not supported by any selected context')
  })

  it('requires an operation and two distinct Capabilities on achieved Journey flows', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/journey-scenarios/browse-and-complete-checkout.md')
    writeFileSync(
      scenario,
      readFileSync(scenario, 'utf8')
        .replace('    operation: Find and select an available product\n', '')
        .replace('    capability: checkout', '    capability: catalog-browsing')
    )
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('flow item 1: needs a non-empty operation')
    expect(errors).toContain('an achieved Journey Scenario needs at least two distinct Capabilities')
  })

  it('treats kind and Journey result as orthogonal fields', () => {
    const cwd = fixtureCopy()
    const source = join(cwd, '.businesslens/journey-scenarios/browse-and-complete-checkout.md')
    const scenario = join(cwd, '.businesslens/journey-scenarios/checkout-is-declined.md')
    writeFileSync(
      scenario,
      readFileSync(source, 'utf8')
        .replace('kind: primary', 'kind: edge')
        .replace('result: achieved', 'result: not-achieved')
        .replace('# Browse and complete checkout', '# Checkout is declined')
    )
    const result = run(cwd)
    expect(result.errors).toEqual([])
  })

  it('grades missing Capability Scenario coverage by model coverage status', () => {
    const cwd = fixtureCopy()
    unlinkSync(join(cwd, '.businesslens/capability-scenarios/refund-order.md'))
    unlinkSync(join(cwd, '.businesslens/business-rules/refund-existing-orders.md'))

    expect(run(cwd).errors.join('\n')).toContain('availability "admin-web/admin-console" needs Capability Scenario coverage')

    const coverage = join(cwd, '.businesslens/coverage.md')
    writeFileSync(coverage, readFileSync(coverage, 'utf8').replace('status: complete', 'status: partial'))
    const partial = run(cwd)
    expect(partial.errors.some(error => error.includes('needs Capability Scenario coverage'))).toBe(false)
    expect(partial.warnings.some(warning => warning.includes('needs Capability Scenario coverage'))).toBe(true)
  })

  it('requires Capability Scenario coverage for every exact Capability context', () => {
    const cwd = fixtureCopy()
    for (const name of ['complete-checkout', 'decline-checkout-payment']) {
      const file = join(cwd, `.businesslens/capability-scenarios/${name}.md`)
      writeFileSync(
        file,
        readFileSync(file, 'utf8').replace(
          '  - interface: customer-mobile\n    experiences: [storefront]\n',
          ''
        )
      )
    }

    expect(run(cwd).errors.join('\n')).toContain(
      'availability "customer-mobile/storefront" needs Capability Scenario coverage'
    )
  })

  it('validates complete Journey routes and their goal-owner entry context', () => {
    const cwd = fixtureCopy()
    const file = join(cwd, '.businesslens/journey-scenarios/browse-and-complete-checkout.md')
    writeFileSync(
      file,
      readFileSync(file, 'utf8')
        .replace(
          '      - stage: select-product\n        interface: customer-web\n        experience: storefront',
          '      - stage: select-product\n        interface: admin-web\n        experience: admin-console'
        )
        .replace(
          '      - stage: complete-checkout\n        interface: customer-mobile\n        experience: storefront\n',
          ''
        )
    )

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('context "admin-web/admin-console" is outside capability "catalog-browsing"')
    expect(errors).toContain('first context "admin-web/admin-console" permits no Journey Actor participating in the Scenario')
    expect(errors).toContain('missing context for flow stage "complete-checkout"')
  })

  it('rejects narrowed Rule contexts outside their target and redundant ancestor targets', () => {
    const cwd = fixtureCopy()
    const file = join(cwd, '.businesslens/business-rules/refund-existing-orders.md')
    writeFileSync(file, readFileSync(file, 'utf8').replace(
      'appliesTo:\n  - type: capability-scenario\n    id: refund-order',
      `appliesTo:
  - type: capability
    id: order-management
  - type: capability-scenario
    id: refund-order
    contexts:
      - interface: customer-web
        experience: storefront`
    ))

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('context "customer-web/storefront" is outside target "capability-scenario:refund-order"')
    expect(errors).toContain('target "capability-scenario:refund-order" is redundant with capability target "order-management"')
  })

  it('requires every Journey Actor to participate in an achieved Scenario', () => {
    const cwd = fixtureCopy()
    const file = join(cwd, '.businesslens/journeys/browse-and-buy.md')
    writeFileSync(file, readFileSync(file, 'utf8').replace('actors: [shopper]', 'actors: [shopper, store-admin]'))

    expect(run(cwd).errors.join('\n')).toContain(
      'actor "store-admin" needs an achieved Journey Scenario'
    )
  })

  it('rejects removed Experience and Journey fields as unknown keys', () => {
    const cwd = fixtureCopy()
    const experience = join(cwd, '.businesslens/experiences/storefront.md')
    writeFileSync(experience, readFileSync(experience, 'utf8').replace('access: public', 'access: public\nexit: done'))
    const journey = join(cwd, '.businesslens/journeys/browse-and-buy.md')
    writeFileSync(journey, readFileSync(journey, 'utf8').replace(
      'actors:',
      'domain: ordering\nentryPoints:\n  - customer-web: /\nactors:'
    ))
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('unknown frontmatter key "exit"')
    expect(errors).toContain('unknown frontmatter key "domain"')
    expect(errors).toContain('unknown frontmatter key "entryPoints"')
  })

  it('rejects authored content that structured export would otherwise drop or reinterpret', () => {
    const cwd = fixtureCopy()
    const journey = join(cwd, '.businesslens/journeys/browse-and-buy.md')
    writeFileSync(journey, readFileSync(journey, 'utf8')
      .replace('# Browse and buy\n\n## Goal', '# Browse and buy\n\nLegacy Journey summary.\n\n## Goal')
      .replace('## Success criterion', '## Outcome\n\nWrong entity shape.\n\n## Success criterion'))

    const scenario = join(cwd, '.businesslens/capability-scenarios/complete-checkout.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8')
      .replace('# Complete checkout\n\n## Trigger', '# Complete checkout\n\nLegacy Scenario summary.\n\n## Trigger')
      .replace(
        '1. The cart is validated against the catalog',
        '1. The cart is validated against the catalog\n   and the continuation would be discarded'
      )
      .replace('## Outcome', '## Goal\n\nWrong entity shape.\n\n## Trigger\n\nDuplicate trigger.\n\n## Outcome')
      .replace(
        'The order is stored and a confirmation is shown.',
        'The order is stored and a confirmation is shown.\n\n## Edge cases\n\nNot a bullet item.'
      )
      .replace(
        'Payment recovery remains supporting context rather than another structured field.',
        '# Nested structural title'
      ))

    const screen = join(cwd, '.businesslens/screens/product-record.md')
    writeFileSync(screen, readFileSync(screen, 'utf8').replace(
      '- Product name and description',
      '- Product name and description\n  with a continuation that is not a second item'
    ))
    const coverage = join(cwd, '.businesslens/coverage.md')
    writeFileSync(coverage, `${readFileSync(coverage, 'utf8')}\n## Notes\n\nThis section would be dropped.\n`)

    const errors = run(cwd).errors.join('\n')
    expect(errors.match(/carries no lead paragraph/g)).toHaveLength(2)
    expect(errors).toContain('"## Outcome" is not allowed on this entity type')
    expect(errors).toContain('duplicate "## Trigger" section')
    expect(errors).toContain('"## Goal" is not allowed on this entity type')
    expect(errors).toContain('"## Steps" must contain only single-line ordered-list items')
    expect(errors).toContain('"## Edge cases" must contain only single-line bullet-list items')
    expect(errors).toContain('"## Edge cases" needs at least one bullet item when present')
    expect(errors).toContain('"## Recovery note" content must not contain an H1 or H2 heading')
    expect(errors).toContain('"## Information presented" must contain only single-line bullet-list items')
    expect(errors).toContain('coverage.md: "## Notes" sections are not supported')
  })

  it('rejects duplicate values in every set-valued frontmatter list', () => {
    const cwd = fixtureCopy()
    const product = join(cwd, '.businesslens/product.md')
    writeFileSync(product, readFileSync(product, 'utf8')
      .replace('tags: [commerce, fixture]', 'tags: [commerce, fixture, commerce]'))
    const productInterface = join(cwd, '.businesslens/interfaces/customer-web.md')
    writeFileSync(productInterface, readFileSync(productInterface, 'utf8')
      .replace('actors: [shopper]', 'actors: [shopper, shopper]'))
    const screen = join(cwd, '.businesslens/screens/product-record.md')
    writeFileSync(screen, readFileSync(screen, 'utf8')
      .replace('capabilities: [catalog-browsing]', 'capabilities: [catalog-browsing, catalog-browsing]'))

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('product.md: "tags" contains duplicate "commerce"')
    expect(errors).toContain('"actors" contains duplicate "shopper"')
    expect(errors).toContain('"capabilities" contains duplicate "catalog-browsing"')
  })

  it('validates Screen relationships and product content', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/screens/product-record.md'), `---
availability:
  - interface: missing-interface
    experiences: [missing-experience]
capabilities: []
capabilityScenarios: [missing-capability-scenario]
journeyScenarios: [missing-journey-scenario]
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
    expect(errors).toContain('references missing Capability Scenario "missing-capability-scenario"')
    expect(errors).toContain('references missing Journey Scenario "missing-journey-scenario"')
    expect(errors).toContain('"## Information presented" needs at least one bullet item')
    expect(errors).toContain('product state "Empty" needs a description')
    expect(errors).toContain('missing "## Capability boundary" section')
  })

  it('requires Screen Scenario relations to match its Capabilities and exact contexts', () => {
    const cwd = fixtureCopy()
    const screen = join(cwd, '.businesslens/screens/product-record.md')
    writeFileSync(
      screen,
      readFileSync(screen, 'utf8')
        .replace('capabilityScenarios: [browse-catalog]', 'capabilityScenarios: [refund-order]')
        .replace('journeyScenarios: [browse-and-complete-checkout]', 'journeyScenarios: [admin-and-checkout]')
    )
    writeFileSync(join(cwd, '.businesslens/journey-scenarios/admin-and-checkout.md'), `---
kind: edge
journey: browse-and-buy
actors: [shopper, store-admin]
result: not-achieved
flow:
  - id: review-order
    capability: order-management
    operation: Review an existing order
  - id: attempt-checkout
    capability: checkout
    operation: Attempt a new checkout
routes:
  - id: admin-to-web
    contexts:
      - stage: review-order
        interface: admin-web
        experience: admin-console
      - stage: attempt-checkout
        interface: customer-web
        experience: storefront
---

# Review an order before checkout

## Trigger

An operator reviews an order while a shopper attempts a new checkout.

## Steps

1. The operator reviews an existing order
2. The shopper attempts checkout

## Outcome

The new checkout does not complete.
`)

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('Capability Scenario "refund-order" uses capability "order-management" outside the Screen capability list')
    expect(errors).toContain('Capability Scenario "refund-order" shares no exact context with the Screen')
    expect(errors).toContain('Journey Scenario "admin-and-checkout" has no flow item matching a Screen capability and exact context')
  })

  it('rejects unknown config keys', () => {
    const cwd = fixtureCopy()
    writeFileSync(
      join(cwd, '.businesslens/config.yaml'),
      'schema: 4\nplatform:\n  url: https://attacker.example\nsdd:\n  paths: []\n'
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
    writeFileSync(join(cwd, '.businesslens/journeys/browse-and-buy.md'), `---
actors: [ghost]
---

# Browse and buy

## Goal

Buy something.

## Success criterion

An order exists.
`)
    const scenario = join(cwd, '.businesslens/journey-scenarios/browse-and-complete-checkout.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace(
      'experience: storefront',
      'experience: missing-experience'
    ))
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
      const journeyFile = join(cwd, '.businesslens/journeys/browse-and-buy.md')
      const scenarioFile = join(cwd, '.businesslens/capability-scenarios/refund-order.md')
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

  it('fails on duplicate ids across Scenario types', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/journey-scenarios/browse-catalog.md'), `---
kind: primary
journey: browse-and-buy
actors: [shopper]
result: achieved
flow:
  - id: select-product
    capability: catalog-browsing
    operation: Select a product
  - id: complete-checkout
    capability: checkout
    operation: Complete checkout
routes:
  - id: web
    contexts:
      - stage: select-product
        interface: customer-web
        experience: storefront
      - stage: complete-checkout
        interface: customer-web
        experience: storefront
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

  it('fails when a Journey loses all achieved Journey Scenarios', () => {
    const cwd = fixtureCopy()
    unlinkSync(join(cwd, '.businesslens/journey-scenarios/browse-and-complete-checkout.md'))
    expect(run(cwd).errors.some(error => error.includes('at least one achieved Journey Scenario'))).toBe(true)
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
