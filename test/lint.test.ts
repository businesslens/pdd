import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
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

/** Write a compact or expanded entity file, creating its parent path. */
function writeEntity(file: string, content: string) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
}

function expandEntity(compactFile: string, expandedFile: string) {
  mkdirSync(dirname(expandedFile), { recursive: true })
  renameSync(compactFile, expandedFile)
}

function compactEntity(expandedFile: string, compactFile: string) {
  renameSync(expandedFile, compactFile)
  rmdirSync(dirname(expandedFile))
}

describe('lintModel', () => {
  it('accepts a reference state that names a Product state, and rejects one that does not', () => {
    const cwd = fixtureCopy()
    const screen = join(cwd, '.businesslens', 'interfaces', 'customer-web', 'experiences', 'storefront', 'screens', 'product-record.md')
    const source = readFileSync(screen, 'utf8')

    // product-record.md declares "### Available" and "### Unavailable".
    const withState = source.replace(
      '    title: Product record visual reference',
      '    title: Product record visual reference\n    state: Available'
    )
    writeFileSync(screen, withState)
    expect(run(cwd).errors).toEqual([])

    writeFileSync(screen, withState.replace('state: Available', 'state: Nonexistent'))
    const bad = run(cwd)
    expect(bad.ok).toBe(false)
    expect(bad.errors.some(e => e.includes('reference state "Nonexistent" is not a product state'))).toBe(true)
  })

  it('rejects a reference state on an entity that is not a Screen', () => {
    const cwd = fixtureCopy()
    const capability = join(cwd, '.businesslens', 'capabilities', 'catalog-browsing', 'capability.md')
    const source = readFileSync(capability, 'utf8')
    writeFileSync(capability, source.replace(
      '    target: src/services/catalog.ts#CatalogService',
      '    target: src/services/catalog.ts#CatalogService\n    state: Available'
    ))
    const result = run(cwd)
    expect(result.ok).toBe(false)
    expect(result.errors.some(e => e.includes('reference "state" is only valid on a Screen'))).toBe(true)
  })

  it('reports an unexpected collection entry instead of silently dropping it', () => {
    const cwd = fixtureCopy()
    const actors = join(cwd, '.businesslens', 'actors')

    // A wrong extension, or an expanded folder that forgot its own file, used
    // to vanish with no finding at all.
    writeFileSync(join(actors, 'draft.txt'), '# Draft\n')
    mkdirSync(join(actors, 'courier'), { recursive: true })

    const result = run(cwd)
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('actors/draft.txt: expected <id>.md or <id>/actor.md')
    expect(result.errors).toContain('actors/courier/ is missing actor.md')
  })

  it('rejects duplicate compact and expanded shapes for one entity', () => {
    const cwd = fixtureCopy()
    writeEntity(
      join(cwd, '.businesslens/actors/shopper/actor.md'),
      readFileSync(join(cwd, '.businesslens/actors/shopper.md'), 'utf8')
    )

    expect(run(cwd).errors).toContain(
      'actors/shopper: both shopper.md and shopper/actor.md exist; keep exactly one entity shape'
    )
  })

  it('requires an expanded entity to own children or assets', () => {
    const cwd = fixtureCopy()
    expandEntity(
      join(cwd, '.businesslens/actors/shopper.md'),
      join(cwd, '.businesslens/actors/shopper/actor.md')
    )

    expect(run(cwd).errors).toContain(
      'actors/shopper/ has no assets or child entities; use actors/shopper.md'
    )
  })

  it('accepts compact Product and expands an entity for its first asset', () => {
    const cwd = fixtureCopy()
    unlinkSync(join(cwd, '.businesslens/product/logo.svg'))
    renameSync(join(cwd, '.businesslens/product/product.md'), join(cwd, '.businesslens/product.md'))
    rmdirSync(join(cwd, '.businesslens/product'))

    const compactScreen = join(
      cwd,
      '.businesslens/interfaces/customer-web/experiences/storefront/screens/product-record.md'
    )
    const expandedScreen = join(
      cwd,
      '.businesslens/interfaces/customer-web/experiences/storefront/screens/product-record/screen.md'
    )
    expandEntity(compactScreen, expandedScreen)
    writeFileSync(join(dirname(expandedScreen), 'mockup.svg'), '<svg viewBox="0 0 1 1"></svg>')
    writeFileSync(
      expandedScreen,
      readFileSync(expandedScreen, 'utf8').replace(
        '---\n\n# Product record',
        'assets:\n  - file: mockup.svg\n    title: Approved product record\n---\n\n# Product record'
      )
    )

    expect(run(cwd).errors).toEqual([])
  })

  it('rejects an expanded Product after its logo is removed', () => {
    const cwd = fixtureCopy()
    unlinkSync(join(cwd, '.businesslens/product/logo.svg'))

    expect(run(cwd).errors).toContain('product/ has no logo asset; use product.md')
  })

  it('rejects an unrecognized child directory inside an entity folder', () => {
    const cwd = fixtureCopy()
    mkdirSync(join(cwd, '.businesslens', 'capabilities', 'checkout', 'notes'), { recursive: true })
    expect(run(cwd).errors).toContain('capabilities/checkout/notes/ is not a recognized child directory')
  })

  it('passes the golden fixture', () => {
    const result = run(fixtureCopy())
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
    expect(result.counts).toEqual({
      actors: 2,
      interfaces: 4,
      experiences: 3,
      screens: 2,
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
    expect(run(cwd).errors).toContain('config.yaml: schema 2 is not supported (expected 5)')
  })

  it('rejects unsupported future folder schemas explicitly', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/config.yaml'), 'schema: 99\nsdd:\n  paths: []\n')
    expect(run(cwd).errors).toContain('config.yaml: schema 99 is not supported (expected 5)')
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
    writeEntity(join(cwd, '.businesslens/actors/partner-system.md'), `---
kind: system
relationship: external
---

# Partner system

An external system that uses a supported integration.
`)
    writeEntity(join(cwd, '.businesslens/actors/store-scheduler.md'), `---
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
    for (const relative of [
      'interfaces/customer-web/experiences/storefront/screens',
      'interfaces/customer-mobile/experiences/storefront/screens'
    ]) {
      rmSync(join(cwd, '.businesslens', relative), { recursive: true })
    }
    for (const surface of ['customer-web', 'customer-mobile']) {
      compactEntity(
        join(cwd, `.businesslens/interfaces/${surface}/experiences/storefront/experience.md`),
        join(cwd, `.businesslens/interfaces/${surface}/experiences/storefront.md`)
      )
    }
    for (const name of ['catalog-browsing', 'checkout', 'order-management']) {
      const file = join(cwd, `.businesslens/capabilities/${name}/capability.md`)
      writeFileSync(file, readFileSync(file, 'utf8').replace(/^domain: .*\n/m, ''))
    }
    const result = run(cwd)
    expect(result.errors).toEqual([])
    expect(result.counts.domains).toBe(0)
    expect(result.counts.screens).toBe(0)
  })

  it('allows direct Interface availability when the Product has no Experiences', () => {
    const cwd = fixtureCopy()
    const bl = join(cwd, '.businesslens')

    // Promote every Experience-scoped Screen up to its Interface and drop the
    // Experiences, leaving each Interface undivided.
    for (const interfaceId of ['customer-web', 'customer-mobile']) {
      const from = join(bl, 'interfaces', interfaceId, 'experiences', 'storefront', 'screens')
      cpSync(from, join(bl, 'interfaces', interfaceId, 'screens'), { recursive: true })
    }
    for (const interfaceId of ['customer-web', 'customer-mobile', 'admin-web']) {
      rmSync(join(bl, 'interfaces', interfaceId, 'experiences'), { recursive: true, force: true })
    }
    compactEntity(
      join(bl, 'interfaces/admin-web/interface.md'),
      join(bl, 'interfaces/admin-web.md')
    )
    // Every scope id loses its Experience segment.
    const scrub = (file: string) => writeFileSync(file, readFileSync(file, 'utf8')
      .replace(/customer-web::storefront/g, 'customer-web')
      .replace(/customer-mobile::storefront/g, 'customer-mobile')
      .replace(/admin-web::admin-console/g, 'admin-web'))
    const walk = (directory: string) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const full = join(directory, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith('.md')) scrub(full)
      }
    }
    walk(bl)

    const result = run(cwd)
    expect(result.errors).toEqual([])
    expect(result.counts.experiences).toBe(0)
  })

  it('rejects a scope naming an Interface that Experiences divide', () => {
    const cwd = fixtureCopy()
    const capability = join(cwd, '.businesslens/capabilities/checkout/capability.md')
    writeFileSync(
      capability,
      readFileSync(capability, 'utf8').replace('customer-web::storefront', 'customer-web')
    )
    expect(run(cwd).errors.join('\n')).toContain(
      'interface "customer-web" is divided into Experiences, so name one of them'
    )
  })

  it('rejects a scope that resolves to no Experience', () => {
    const cwd = fixtureCopy()
    const capability = join(cwd, '.businesslens/capabilities/checkout/capability.md')
    writeFileSync(
      capability,
      readFileSync(capability, 'utf8').replace('customer-web::storefront', 'customer-web::missing')
    )
    expect(run(cwd).errors.join('\n')).toContain(
      'availability references missing experience "customer-web::missing"'
    )
  })

  /*
    The fixture ships `operator-cli` undivided. Giving it its own Experience
    keeps both shapes covered: a non-visual Interface works whether or not an
    Experience divides it.
  */
  it('supports a non-visual CLI Interface alongside visual Interfaces', () => {
    const cwd = fixtureCopy()
    expandEntity(
      join(cwd, '.businesslens/interfaces/operator-cli.md'),
      join(cwd, '.businesslens/interfaces/operator-cli/interface.md')
    )
    writeEntity(
      join(cwd, '.businesslens/interfaces/operator-cli/experiences/order-desk.md'),
      `---
actors: [store-admin]
access: restricted
entryPoints:
  - operator-cli: fixture-shop orders
---

# Order desk

Where an operator works through orders from the command line.

## Capability boundary

Supports order operations. It does not expose a shopper's account.
`
    )
    for (const relative of [
      '.businesslens/capabilities/order-management/capability.md',
      '.businesslens/capabilities/order-management/scenarios/refund-order.md'
    ]) {
      const file = join(cwd, relative)
      writeFileSync(
        file,
        readFileSync(file, 'utf8').replace('operator-cli', 'operator-cli::order-desk')
      )
    }
    expect(run(cwd).errors).toEqual([])
  })

  it('checks Interface audiences and Interface-keyed Experience entry points', () => {
    const cwd = fixtureCopy()
    const productInterface = join(cwd, '.businesslens/interfaces/customer-web/interface.md')
    writeFileSync(productInterface, readFileSync(productInterface, 'utf8').replace('actors: [shopper]', 'actors: [store-admin]'))
    const experience = join(cwd, '.businesslens/interfaces/customer-web/experiences/storefront/experience.md')
    writeFileSync(experience, readFileSync(experience, 'utf8').replace('  - customer-web: /', '  - missing-interface: /'))
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('actor "shopper" is not supported by interface "customer-web"')
    expect(errors).toContain('entry point references undeclared interface "missing-interface"')
  })

  it('requires Experiences to cover every Actor of an Interface they divide', () => {
    const cwd = fixtureCopy()
    const productInterface = join(cwd, '.businesslens/interfaces/customer-web/interface.md')
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
    const capability = join(cwd, '.businesslens/capabilities/checkout/capability.md')
    writeFileSync(
      capability,
      readFileSync(capability, 'utf8').replace(
        'availability: [customer-web::storefront, customer-mobile::storefront]',
        'availability: [customer-web::storefront, customer-web::storefront]'
      )
    )
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('duplicate availability scope "customer-web::storefront"')
    expect(errors).toContain('availability "customer-mobile::storefront" is outside capability "checkout"')
  })

  it('requires Capability Scenario availability to be a Capability subset', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/capabilities/checkout/scenarios/complete-checkout.md')
    writeFileSync(
      scenario,
      readFileSync(scenario, 'utf8').replace('customer-web::storefront', 'admin-web::admin-console')
    )
    expect(run(cwd).errors.join('\n'))
      .toContain('availability "admin-web::admin-console" is outside capability "checkout"')
  })

  it('requires every Scenario Actor to participate in a selected exact context', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/capabilities/order-management/scenarios/refund-order.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace(
      'actors: [store-admin]',
      'actors: [shopper]'
    ))
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('context "admin-web::admin-console" permits none of the Scenario Actors')
    expect(errors).toContain('actor "shopper" is not supported by any selected context')
  })

  it('requires step text and two distinct Capabilities on achieved Journey paths', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    writeFileSync(
      scenario,
      readFileSync(scenario, 'utf8')
        .replace(
          '  - text: The shopper finds and selects an available product\n    capability: catalog-browsing\n',
          '  - capability: catalog-browsing\n'
        )
        .replace('    capability: checkout', '    capability: catalog-browsing')
    )
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('step 1: needs non-empty text')
    expect(errors).toContain('an achieved Journey Scenario needs at least two distinct Capabilities')
  })

  it('rejects the removed Journey flow, operation, top-level routes, and Markdown Steps', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    writeFileSync(
      scenario,
      readFileSync(scenario, 'utf8')
        .replace(
          'result: achieved',
          'result: achieved\nflow:\n  - id: legacy-stage\n    capability: catalog-browsing\n    operation: Legacy duplicated sentence\nroutes:\n  - id: web\n    contexts: []'
        )
        .replace('## Outcome', '## Steps\n\n1. Legacy duplicated sentence\n\n## Outcome')
    )

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('"flow" is no longer supported; use the frontmatter "steps" list')
    expect(errors).toContain('"operation" is no longer supported; put each sentence in "steps[].text"')
    expect(errors).toContain('top-level "routes" is no longer supported')
    expect(errors).toContain('"## Steps" is not allowed on this entity type')
  })

  /*
    Routes are correlated paths, so a second id over the same assignment claims
    a lane the Product does not have — a `mobile` route that never leaves web.
  */
  it('rejects two routes that correlate the same context at every Capability-bearing step', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replaceAll('customer-mobile::storefront', 'customer-web::storefront'))
    expect(run(cwd).errors.join('\n')).toContain('route "mobile" repeats every context of route "web"')
  })

  /* One differing step is a real cross-Interface handoff, not a repeated lane. */
  it('keeps two routes that differ at any single Capability-bearing step', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace(
      '  - text: The shopper submits checkout\n    capability: checkout\n    routes:\n      web: customer-web::storefront\n      mobile: customer-mobile::storefront',
      '  - text: The shopper submits checkout\n    capability: checkout\n    routes:\n      web: customer-web::storefront\n      mobile: customer-web::storefront'
    ))
    expect(run(cwd).errors.join('\n')).not.toContain('repeats every context')
  })

  it('treats kind and Journey result as orthogonal fields', () => {
    const cwd = fixtureCopy()
    const source = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    const scenario = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/checkout-is-declined.md')
    writeEntity(
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
    unlinkSync(join(cwd, '.businesslens/capabilities/order-management/scenarios/refund-order.md'))
    rmdirSync(join(cwd, '.businesslens/capabilities/order-management/scenarios'))
    compactEntity(
      join(cwd, '.businesslens/capabilities/order-management/capability.md'),
      join(cwd, '.businesslens/capabilities/order-management.md')
    )
    unlinkSync(join(cwd, '.businesslens/business-rules/refund-existing-orders.md'))

    expect(run(cwd).errors.join('\n')).toContain('availability "admin-web::admin-console" needs Capability Scenario coverage')

    const coverage = join(cwd, '.businesslens/coverage.md')
    writeFileSync(coverage, readFileSync(coverage, 'utf8').replace('status: complete', 'status: partial'))
    const partial = run(cwd)
    expect(partial.errors.some(error => error.includes('needs Capability Scenario coverage'))).toBe(false)
    expect(partial.warnings.some(warning => warning.includes('needs Capability Scenario coverage'))).toBe(true)
  })

  it('requires Capability Scenario coverage for every exact Capability context', () => {
    const cwd = fixtureCopy()
    for (const name of ['complete-checkout', 'decline-checkout-payment']) {
      const file = join(cwd, `.businesslens/capabilities/checkout/scenarios/${name}.md`)
      writeFileSync(
        file,
        readFileSync(file, 'utf8').replace(', customer-mobile::storefront', '')
      )
    }

    expect(run(cwd).errors.join('\n')).toContain(
      'availability "customer-mobile::storefront" needs Capability Scenario coverage'
    )
  })

  it('validates complete Journey step routes and their goal-owner entry context', () => {
    const cwd = fixtureCopy()
    const file = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    writeFileSync(
      file,
      readFileSync(file, 'utf8')
        .replace(
          '      web: customer-web::storefront\n      mobile: customer-mobile::storefront',
          '      web: admin-web::admin-console\n      mobile: customer-mobile::storefront'
        )
        .replace(
          '  - text: The shopper submits checkout\n    capability: checkout\n    routes:\n      web: customer-web::storefront\n      mobile: customer-mobile::storefront',
          '  - text: The shopper submits checkout\n    capability: checkout\n    routes:\n      web: customer-web::storefront'
        )
    )

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('context "admin-web::admin-console" is outside capability "catalog-browsing"')
    expect(errors).toContain('first context "admin-web::admin-console" permits no Journey Actor participating in the Scenario')
    expect(errors).toContain('step 2: route ids must match every other Capability-bearing step')
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
      - context: customer-web::storefront`
    ))

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('context "customer-web::storefront" is outside target "capability-scenario:refund-order"')
    expect(errors).toContain('target "capability-scenario:refund-order" is redundant with capability target "order-management"')
  })

  it('requires every Journey Actor to participate in an achieved Scenario', () => {
    const cwd = fixtureCopy()
    const file = join(cwd, '.businesslens/journeys/browse-and-buy/journey.md')
    writeFileSync(file, readFileSync(file, 'utf8').replace('actors: [shopper]', 'actors: [shopper, store-admin]'))

    expect(run(cwd).errors.join('\n')).toContain(
      'actor "store-admin" needs an achieved Journey Scenario'
    )
  })

  it('rejects removed Experience and Journey fields as unknown keys', () => {
    const cwd = fixtureCopy()
    const experience = join(cwd, '.businesslens/interfaces/customer-web/experiences/storefront/experience.md')
    writeFileSync(experience, readFileSync(experience, 'utf8').replace('access: public', 'access: public\nexit: done'))
    const journey = join(cwd, '.businesslens/journeys/browse-and-buy/journey.md')
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
    const journey = join(cwd, '.businesslens/journeys/browse-and-buy/journey.md')
    writeFileSync(journey, readFileSync(journey, 'utf8')
      .replace('# Browse and buy\n\n## Goal', '# Browse and buy\n\nLegacy Journey summary.\n\n## Goal')
      .replace('## Success criterion', '## Outcome\n\nWrong entity shape.\n\n## Success criterion'))

    const scenario = join(cwd, '.businesslens/capabilities/checkout/scenarios/complete-checkout.md')
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

    const screen = join(cwd, '.businesslens/interfaces/customer-web/experiences/storefront/screens/product-record.md')
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
    const product = join(cwd, '.businesslens/product/product.md')
    writeFileSync(product, readFileSync(product, 'utf8')
      .replace('tags: [commerce, fixture]', 'tags: [commerce, fixture, commerce]'))
    const productInterface = join(cwd, '.businesslens/interfaces/customer-web/interface.md')
    writeFileSync(productInterface, readFileSync(productInterface, 'utf8')
      .replace('actors: [shopper]', 'actors: [shopper, shopper]'))
    const screen = join(cwd, '.businesslens/interfaces/customer-web/experiences/storefront/screens/product-record.md')
    writeFileSync(screen, readFileSync(screen, 'utf8')
      .replace('capabilities: [catalog-browsing]', 'capabilities: [catalog-browsing, catalog-browsing]'))

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('product.md: "tags" contains duplicate "commerce"')
    expect(errors).toContain('"actors" contains duplicate "shopper"')
    expect(errors).toContain('"capabilities" contains duplicate "catalog-browsing"')
  })

  it('validates Screen relationships and product content', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/interfaces/customer-web/experiences/storefront/screens/product-record.md'), `---
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
    expect(errors).toContain('needs at least one capability')
    expect(errors).toContain('references missing Capability Scenario "missing-capability-scenario"')
    expect(errors).toContain('references missing Journey Scenario "missing-journey-scenario"')
    expect(errors).toContain('"## Information presented" needs at least one bullet item')
    expect(errors).toContain('product state "Empty" needs a description')
    expect(errors).toContain('missing "## Capability boundary" section')
  })

  it('requires Screen Scenario relations to match its Capabilities and exact contexts', () => {
    const cwd = fixtureCopy()
    const screen = join(cwd, '.businesslens/interfaces/customer-web/experiences/storefront/screens/product-record.md')
    writeFileSync(
      screen,
      readFileSync(screen, 'utf8')
        .replace('capabilityScenarios: [browse-catalog]', 'capabilityScenarios: [refund-order]')
        .replace('journeyScenarios: [browse-and-complete-checkout]', 'journeyScenarios: [admin-and-checkout]')
    )
    writeEntity(join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/admin-and-checkout.md'), `---
kind: edge
journey: browse-and-buy
actors: [shopper, store-admin]
result: not-achieved
steps:
  - text: The operator reviews an existing order
    capability: order-management
    routes:
      admin-to-web: admin-web::admin-console
  - text: The shopper attempts checkout
    capability: checkout
    routes:
      admin-to-web: customer-web::storefront
---

# Review an order before checkout

## Trigger

An operator reviews an order while a shopper attempts a new checkout.

## Outcome

The new checkout does not complete.
`)

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('Capability Scenario "refund-order" uses capability "order-management" outside the Screen capability list')
    expect(errors).toContain('Capability Scenario "refund-order" shares no exact context with the Screen')
    expect(errors).toContain('Journey Scenario "admin-and-checkout" has no Capability-bearing step matching a Screen capability and exact context')
  })

  it('rejects unknown config keys', () => {
    const cwd = fixtureCopy()
    writeFileSync(
      join(cwd, '.businesslens/config.yaml'),
      'schema: 5\nplatform:\n  url: https://attacker.example\nsdd:\n  paths: []\n'
    )
    expect(run(cwd).errors).toContain('config.yaml: unknown key "platform"')
  })

  it('rejects product ids longer than 64 characters', () => {
    const cwd = fixtureCopy()
    const product = join(cwd, '.businesslens/product/product.md')
    writeFileSync(product, readFileSync(product, 'utf8').replace('id: fixture-shop', `id: ${'a'.repeat(65)}`))
    expect(run(cwd).errors).toContain('product.md: id must be at most 64 characters')
  })

  it('fails on dangling relations and missing required relationships', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/journeys/browse-and-buy/journey.md'), `---
actors: [ghost]
---

# Browse and buy

## Goal

Buy something.

## Success criterion

An order exists.
`)
    const scenario = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace(
      'web: customer-web::storefront',
      'web: customer-web::missing-experience'
    ))
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('missing actor "ghost"')
    expect(errors).toContain('context references missing experience "customer-web::missing-experience"')
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
      const journeyFile = join(cwd, '.businesslens/journeys/browse-and-buy/journey.md')
      const scenarioFile = join(cwd, '.businesslens/capabilities/order-management/scenarios/refund-order.md')
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
    writeEntity(join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-catalog.md'), `---
kind: primary
journey: browse-and-buy
actors: [shopper]
result: achieved
steps:
  - text: Select a product
    capability: catalog-browsing
    routes:
      web: customer-web::storefront
  - text: Complete checkout
    capability: checkout
    routes:
      web: customer-web::storefront
---

# Duplicate

## Trigger

t.

## Outcome

o.
`)
    expect(run(cwd).errors.some(error => error.includes('already used'))).toBe(true)
  })

  it('fails on a bad access mode', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/interfaces/customer-web/experiences/storefront/experience.md'), `---
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
    unlinkSync(join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md'))
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
    const product = join(cwd, '.businesslens/product/product.md')
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
