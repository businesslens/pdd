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

/** Write a compact or expanded element file, creating its parent path. */
function writeElement(file: string, content: string) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
}

function expandElement(compactFile: string, expandedFile: string) {
  mkdirSync(dirname(expandedFile), { recursive: true })
  renameSync(compactFile, expandedFile)
}

function compactElement(expandedFile: string, compactFile: string) {
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

  it('rejects a reference state on an element that is not a Screen', () => {
    const cwd = fixtureCopy()
    const capability = join(cwd, '.businesslens', 'capabilities', 'browse-catalog', 'capability.md')
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

  it('rejects duplicate compact and expanded shapes for one element', () => {
    const cwd = fixtureCopy()
    writeElement(
      join(cwd, '.businesslens/actors/shopper/actor.md'),
      readFileSync(join(cwd, '.businesslens/actors/shopper.md'), 'utf8')
    )

    expect(run(cwd).errors).toContain(
      'actors/shopper: both shopper.md and shopper/actor.md exist; keep exactly one element shape'
    )
  })

  it('warns rather than fails on an expanded element that owns nothing yet', () => {
    const cwd = fixtureCopy()
    expandElement(
      join(cwd, '.businesslens/actors/shopper.md'),
      join(cwd, '.businesslens/actors/shopper/actor.md')
    )
    const result = run(cwd)

    // An author reaches the expanded shape in two steps, and the model is
    // loadable throughout. The rule still holds — expansion normalizes the
    // folder back to the compact form — so it is reported, but it does not
    // fail a model that is otherwise correct.
    expect(result.warnings).toContain(
      'actors/shopper/ has no assets or child elements; use actors/shopper.md'
    )
    expect(result.errors).not.toContain(
      'actors/shopper/ has no assets or child elements; use actors/shopper.md'
    )
    expect(result.ok).toBe(true)
  })

  it('accepts compact Product and expands an element for its first asset', () => {
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
    expandElement(compactScreen, expandedScreen)
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

  it('rejects an unrecognized child directory inside an element folder', () => {
    const cwd = fixtureCopy()
    mkdirSync(join(cwd, '.businesslens', 'capabilities', 'place-order', 'notes'), { recursive: true })
    expect(run(cwd).errors).toContain('capabilities/place-order/notes/ is not a recognized child directory')
  })

  it('passes the golden fixture', () => {
    const result = run(fixtureCopy())
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
    expect(result.counts).toEqual({
      actors: 2,
      interfaces: 4,
      experiences: 2,
      screens: 2,
      domains: 1,
      entities: 1,
      capabilities: 3,
      capabilityScenarios: 4,
      journeys: 1,
      journeyScenarios: 2,
      businessRules: 2
    })
  })

  it('rejects historical folder schemas', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/config.yaml'), 'schema: 5\nsdd:\n  paths: []\n')
    expect(run(cwd).errors).toContain('config.yaml: schema 5 is not supported (expected 7)')
  })

  it('rejects unsupported future folder schemas explicitly', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/config.yaml'), 'schema: 99\nsdd:\n  paths: []\n')
    expect(run(cwd).errors).toContain('config.yaml: schema 99 is not supported (expected 7)')
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
    writeElement(join(cwd, '.businesslens/actors/partner-system.md'), `---
kind: system
relationship: external
---

# Partner system

An external system that uses a supported integration.
`)
    writeElement(join(cwd, '.businesslens/actors/store-scheduler.md'), `---
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
    rmSync(join(cwd, '.businesslens/entities'), { recursive: true })
    for (const relative of [
      'interfaces/customer-web/experiences/storefront/screens',
      'interfaces/customer-mobile/experiences/storefront/screens'
    ]) {
      rmSync(join(cwd, '.businesslens', relative), { recursive: true })
    }
    for (const interfaceId of ['customer-web', 'customer-mobile']) {
      compactElement(
        join(cwd, `.businesslens/interfaces/${interfaceId}/experiences/storefront/experience.md`),
        join(cwd, `.businesslens/interfaces/${interfaceId}/experiences/storefront.md`)
      )
    }
    for (const name of ['browse-catalog', 'place-order', 'manage-orders']) {
      const file = join(cwd, `.businesslens/capabilities/${name}/capability.md`)
      writeFileSync(file, readFileSync(file, 'utf8').replace(/^domain: .*\n/m, ''))
    }
    for (const file of [
      ...readdirSync(join(cwd, '.businesslens/capabilities'), { recursive: true })
        .filter(item => String(item).endsWith('.md'))
        .map(item => join(cwd, '.businesslens/capabilities', String(item))),
      ...readdirSync(join(cwd, '.businesslens/journeys'), { recursive: true })
        .filter(item => String(item).endsWith('.md'))
        .map(item => join(cwd, '.businesslens/journeys', String(item)))
    ]) {
      writeFileSync(file, readFileSync(file, 'utf8')
        .replaceAll('customer-web::storefront::product-record', 'customer-web::storefront')
        .replaceAll('customer-mobile::storefront::product-record', 'customer-mobile::storefront'))
    }
    const result = run(cwd)
    expect(result.errors).toEqual([])
    expect(result.counts.domains).toBe(0)
    expect(result.counts.screens).toBe(0)
  })

  it('allows direct Interface availability when the Product has no Experiences', () => {
    const cwd = fixtureCopy()
    const bl = join(cwd, '.businesslens')

    // Promote every Experience-contained Screen up to its Interface and drop the
    // Experiences, leaving each Interface undivided.
    for (const interfaceId of ['customer-web', 'customer-mobile']) {
      const from = join(bl, 'interfaces', interfaceId, 'experiences', 'storefront', 'screens')
      cpSync(from, join(bl, 'interfaces', interfaceId, 'screens'), { recursive: true })
    }
    for (const interfaceId of ['customer-web', 'customer-mobile', 'admin-web']) {
      rmSync(join(bl, 'interfaces', interfaceId, 'experiences'), { recursive: true, force: true })
    }
    // Every availability Context loses its Experience segment.
    const scrub = (file: string) => writeFileSync(file, readFileSync(file, 'utf8')
      .replace(/customer-web::storefront/g, 'customer-web')
      .replace(/customer-mobile::storefront/g, 'customer-mobile')
      .replace(/admin-web/g, 'admin-web'))
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

  it('rejects an availability Context naming an Interface that Experiences divide', () => {
    const cwd = fixtureCopy()
    const capability = join(cwd, '.businesslens/capabilities/place-order/capability.md')
    writeFileSync(
      capability,
      readFileSync(capability, 'utf8').replace('customer-web::storefront', 'customer-web')
    )
    expect(run(cwd).errors.join('\n')).toContain(
      'interface "customer-web" is divided into Experiences, so name one of them'
    )
  })

  it('rejects a Context place that resolves to no Experience', () => {
    const cwd = fixtureCopy()
    const capability = join(cwd, '.businesslens/capabilities/place-order/capability.md')
    writeFileSync(
      capability,
      readFileSync(capability, 'utf8').replace('customer-web::storefront', 'customer-web::missing')
    )
    expect(run(cwd).errors.join('\n')).toContain(
      'availability Context references missing experience "customer-web::missing"'
    )
  })

  it('requires every authored Context to use the strict place object', () => {
    const cwd = fixtureCopy()
    const capability = join(cwd, '.businesslens/capabilities/place-order/capability.md')
    writeFileSync(
      capability,
      readFileSync(capability, 'utf8')
        .replace('{ place: customer-web::storefront }', 'customer-web::storefront')
        .replace(
          '{ place: customer-mobile::storefront }',
          '{ place: customer-mobile::storefront, actor: shopper }'
        )
    )

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('context must be a mapping with "place"')
    expect(errors).toContain('unknown frontmatter key "actor"')
  })

  /*
    The fixture ships `operator-cli` undivided. Giving it its own Experience
    keeps both shapes covered: a non-visual Interface works whether or not an
    Experience divides it.
  */
  it('supports a non-visual CLI Interface alongside visual Interfaces', () => {
    const cwd = fixtureCopy()
    expandElement(
      join(cwd, '.businesslens/interfaces/operator-cli.md'),
      join(cwd, '.businesslens/interfaces/operator-cli/interface.md')
    )
    writeElement(
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
      '.businesslens/capabilities/manage-orders/capability.md',
      '.businesslens/capabilities/manage-orders/scenarios/refund-order.md'
    ]) {
      const file = join(cwd, relative)
      writeFileSync(
        file,
        readFileSync(file, 'utf8').replaceAll('operator-cli', 'operator-cli::order-desk')
      )
    }
    expect(run(cwd).errors).toEqual([])
  })

  it('requires a supported authored Interface type', () => {
    const cwd = fixtureCopy()
    const productInterface = join(cwd, '.businesslens/interfaces/customer-web/interface.md')
    const source = readFileSync(productInterface, 'utf8')

    writeFileSync(productInterface, source.replace('type: web\n', ''))
    expect(run(cwd).errors.join('\n')).toContain(
      'type "" must be web|mobile-app|desktop-app|cli|api|webhook|messaging|voice|device'
    )

    writeFileSync(productInterface, source.replace('type: web', 'type: react'))
    expect(run(cwd).errors.join('\n')).toContain(
      'type "react" must be web|mobile-app|desktop-app|cli|api|webhook|messaging|voice|device'
    )
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
    const capability = join(cwd, '.businesslens/capabilities/place-order/capability.md')
    writeFileSync(
      capability,
      readFileSync(capability, 'utf8').replace(
        'availability: [{ place: customer-web::storefront }, { place: customer-mobile::storefront }]',
        'availability: [{ place: customer-web::storefront }, { place: customer-web::storefront }]'
      )
    )
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('duplicate availability Context place "customer-web::storefront"')
    expect(errors).toContain('Context place "customer-mobile::storefront" is outside capability "place-order"')
  })

  it('requires Capability Scenario Context places to be inside the Capability availability', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/capabilities/place-order/scenarios/complete-checkout.md')
    writeFileSync(
      scenario,
      readFileSync(scenario, 'utf8').replace('customer-web::storefront::product-record', 'admin-web')
    )
    expect(run(cwd).errors.join('\n'))
      .toContain('Context place "admin-web" is outside capability "place-order"')
  })

  it('requires every Scenario Actor to participate in a selected Context', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/capabilities/manage-orders/scenarios/refund-order.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace(
      'actor: store-admin',
      'actor: shopper'
    ))
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('Context place "admin-web" permits none of the Scenario Actors')
    expect(errors).toContain('actor "shopper" is not supported by any selected Context place')
  })

  it('requires step text and two distinct Capabilities on achieved Journey paths', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    writeFileSync(
      scenario,
      readFileSync(scenario, 'utf8')
        .replace('  - text: The shopper finds and selects an available product', '  - text: ""')
        .replace('    capability: place-order', '    capability: browse-catalog')
    )
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('step 1: needs non-empty text')
    expect(errors).toContain('an achieved Journey Scenario needs at least two distinct Capabilities')
  })

  it('rejects removed Journey flow, operation, Scenario actors, per-Step routes, and Markdown Steps', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    writeFileSync(
      scenario,
      readFileSync(scenario, 'utf8')
        .replace(
          'result: achieved',
          'result: achieved\nactors: [shopper]\nflow:\n  - id: legacy-stage\n    capability: browse-catalog\n    operation: Legacy duplicated sentence'
        )
        .replace('    contexts:', '    operation: Legacy duplicated sentence\n    routes:')
        .replace('## Outcome', '## Steps\n\n1. Legacy duplicated sentence\n\n## Outcome')
    )

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('unknown frontmatter key "flow"')
    expect(errors).toContain('unknown frontmatter key "actors"')
    expect(errors).toContain('unknown frontmatter key "operation"')
    expect(errors).toContain('unknown frontmatter key "routes"')
    expect(errors).toContain('"## Steps" is not allowed on this element type')
  })

  /*
    Routes are correlated paths, so a second id over the same assignment claims
    a lane the Product does not have — a `mobile` route that never leaves web.
  */
  it('rejects two routes that correlate the same context at every Capability-bearing step', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replaceAll(
      'customer-mobile::storefront::product-record',
      'customer-web::storefront::product-record'
    ))
    expect(run(cwd).errors.join('\n')).toContain('route "mobile" repeats every Context place of route "web"')
  })

  /* One differing step is a real cross-Interface handoff, not a repeated lane. */
  it('keeps two routes that differ at any single Capability-bearing step', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace(
      '        place: customer-mobile::storefront::product-record',
      '        place: customer-web::storefront::product-record'
    ))
    expect(run(cwd).errors.join('\n')).not.toContain('repeats every Context place')
  })

  it('treats kind and Journey result as orthogonal fields', () => {
    const cwd = fixtureCopy()
    const source = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    const scenario = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/checkout-is-declined.md')
    writeElement(
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
    unlinkSync(join(cwd, '.businesslens/capabilities/manage-orders/scenarios/refund-order.md'))
    rmdirSync(join(cwd, '.businesslens/capabilities/manage-orders/scenarios'))
    compactElement(
      join(cwd, '.businesslens/capabilities/manage-orders/capability.md'),
      join(cwd, '.businesslens/capabilities/manage-orders.md')
    )
    unlinkSync(join(cwd, '.businesslens/business-rules/refunds-apply-only-to-existing-orders.md'))

    expect(run(cwd).errors.join('\n')).toContain('availability Context place "admin-web" needs Capability Scenario coverage')

    const coverage = join(cwd, '.businesslens/coverage.md')
    writeFileSync(coverage, readFileSync(coverage, 'utf8').replace('status: complete', 'status: partial'))
    const partial = run(cwd)
    expect(partial.errors.some(error => error.includes('needs Capability Scenario coverage'))).toBe(false)
    expect(partial.warnings.some(warning => warning.includes('needs Capability Scenario coverage'))).toBe(true)
  })

  it('requires Capability Scenario coverage for every availability Context', () => {
    const cwd = fixtureCopy()
    for (const name of ['complete-checkout', 'decline-checkout-payment']) {
      const file = join(cwd, `.businesslens/capabilities/place-order/scenarios/${name}.md`)
      writeFileSync(
        file,
        readFileSync(file, 'utf8')
          .replace('  mobile: Mobile\n', '')
          .replaceAll('      mobile:\n        place: customer-mobile::storefront::product-record\n', '')
      )
    }

    expect(run(cwd).errors.join('\n')).toContain(
      'availability Context place "customer-mobile::storefront" needs Capability Scenario coverage'
    )
  })

  it('validates complete Journey step routes and their goal-owner entry context', () => {
    const cwd = fixtureCopy()
    const file = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    writeFileSync(
      file,
      readFileSync(file, 'utf8')
        .replace(
          '        place: customer-web::storefront::product-record',
          '        place: admin-web'
        )
        .replace(
          '      mobile:\n        place: customer-mobile::storefront::product-record',
          ''
        )
    )

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('Context place "admin-web" is outside capability "browse-catalog"')
    expect(errors).toContain('Context place does not support actor "shopper"')
    expect(errors).toContain('step 1: contexts must assign every declared route or be omitted')
  })

  it('rejects narrowed Rule contexts outside their target and redundant ancestor targets', () => {
    const cwd = fixtureCopy()
    const file = join(cwd, '.businesslens/business-rules/refunds-apply-only-to-existing-orders.md')
    writeFileSync(file, readFileSync(file, 'utf8').replace(
      'appliesTo:\n  - type: capability-scenario\n    id: refund-order\n  - type: journey\n    id: browse-and-buy',
      `appliesTo:
  - type: capability
    id: manage-orders
  - type: capability-scenario
    id: refund-order
    contexts:
      - place: customer-web::storefront`
    ))

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('Context place "customer-web::storefront" is outside target "capability-scenario:refund-order"')
    expect(errors).toContain('target "capability-scenario:refund-order" is redundant with capability target "manage-orders"')
  })

  it('lets a Rule Context select descendants and rejects redundant nested selectors', () => {
    const cwd = fixtureCopy()
    const file = join(cwd, '.businesslens/business-rules/refunds-apply-only-to-existing-orders.md')
    const source = readFileSync(file, 'utf8').replace(
      'appliesTo:\n  - type: capability-scenario\n    id: refund-order',
      'appliesTo:\n  - type: capability\n    id: browse-catalog\n    contexts:\n      - place: customer-web'
    )
    writeFileSync(file, source)
    expect(run(cwd).errors).toEqual([])

    // An Interface selector already covers its Experiences, so naming both is
    // redundant rather than narrower.
    writeFileSync(file, source.replace(
      '      - place: customer-web',
      '      - place: customer-web\n      - place: customer-web::storefront'
    ))
    expect(run(cwd).errors.join('\n')).toContain(
      'Context place "customer-web::storefront" is redundant with "customer-web"'
    )
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
      .replace('## Success criterion', '## Outcome\n\nWrong element shape.\n\n## Success criterion'))

    const scenario = join(cwd, '.businesslens/capabilities/place-order/scenarios/complete-checkout.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8')
      .replace('# Complete checkout\n\n## Trigger', '# Complete checkout\n\nLegacy Scenario summary.\n\n## Trigger')
      .replace('## Outcome', '## Goal\n\nWrong element shape.\n\n## Trigger\n\nDuplicate trigger.\n\n## Outcome')
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
    expect(errors).toContain('"## Outcome" is not allowed on this element type')
    expect(errors).toContain('duplicate "## Trigger" section')
    expect(errors).toContain('"## Goal" is not allowed on this element type')
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
      .replace('  - browse-catalog\n', '  - browse-catalog\n  - browse-catalog\n'))

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('product.md: "tags" contains duplicate "commerce"')
    expect(errors).toContain('"actors" contains duplicate "shopper"')
    expect(errors).toContain('"capabilities" contains duplicate "browse-catalog"')
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
    expect(errors).toContain('unknown frontmatter key "availability"')
    expect(errors).toContain('unknown frontmatter key "capabilityScenarios"')
    expect(errors).toContain('unknown frontmatter key "journeyScenarios"')
    expect(errors).toContain('"## Information presented" needs at least one bullet item')
    expect(errors).toContain('product state "Empty" needs a description')
    expect(errors).toContain('missing "## Capability boundary" section')
  })

  it('requires Scenario Screen Contexts to expose their step Capability', () => {
    const cwd = fixtureCopy()
    const screen = join(cwd, '.businesslens/interfaces/customer-web/experiences/storefront/screens/product-record.md')
    writeFileSync(
      screen,
      readFileSync(screen, 'utf8').replace('  - place-order\n', '')
    )

    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('Screen "customer-web::storefront::product-record" does not expose capability "place-order"')
  })

  it('rejects unknown config keys', () => {
    const cwd = fixtureCopy()
    writeFileSync(
      join(cwd, '.businesslens/config.yaml'),
      'schema: 7\nplatform:\n  url: https://attacker.example\nsdd:\n  paths: []\n'
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
      'place: customer-web::storefront::product-record',
      'place: customer-web::missing-experience::product-record'
    ))
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('missing actor "ghost"')
    expect(errors).toContain('Context references missing place "customer-web::missing-experience::product-record"')
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
      const scenarioFile = join(cwd, '.businesslens/capabilities/manage-orders/scenarios/refund-order.md')
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
    writeElement(join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-catalog.md'), `---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: Select a product
    kind: actor
    actor: shopper
    capability: browse-catalog
    contexts:
      web:
        place: customer-web::storefront::product-record
  - text: Complete checkout
    kind: actor
    actor: shopper
    capability: place-order
    contexts:
      web:
        place: customer-web::storefront::product-record
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

  it('rejects duplicate reference targets on one element', () => {
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
