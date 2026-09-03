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

/** Write a compact or expanded resource file, creating its parent path. */
function writeResource(file: string, content: string) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
}

function expandResource(compactFile: string, expandedFile: string) {
  mkdirSync(dirname(expandedFile), { recursive: true })
  renameSync(compactFile, expandedFile)
}

function compactResource(expandedFile: string, compactFile: string) {
  renameSync(expandedFile, compactFile)
  rmdirSync(dirname(expandedFile))
}

/** The fixture's Shopper, with an extra frontmatter block spliced in. */
function shopperWith(block: string): string {
  return `---
kind: person
acts: external
relations:
  - entity: order
    verb: owns
    cardinality: one-to-many
${block}
---

# Shopper

Lead.

## Information kept

- **Delivery address** — where their orders are sent
`
}

function writeRule(cwd: string, id: string, frontmatter: string) {
  writeResource(join(cwd, `.businesslens/business-rules/${id}.md`), `---
${frontmatter}
---

# ${id}

Lead.
`)
}

describe('lintModel', () => {
  it('accepts a reference state that names a View state, and rejects one that does not', () => {
    const cwd = fixtureCopy()
    const screen = join(cwd, '.businesslens', 'interfaces', 'customer-web', 'experiences', 'storefront', 'screens', 'product-record.md')
    const source = readFileSync(screen, 'utf8')

    // product-record.md declares "### Ready to buy" and "### Purchase blocked".
    const withState = source.replace(
      '    title: Product record visual reference',
      '    title: Product record visual reference\n    state: Ready to buy'
    )
    writeFileSync(screen, withState)
    expect(run(cwd).errors).toEqual([])

    writeFileSync(screen, withState.replace('state: Ready to buy', 'state: Nonexistent'))
    const bad = run(cwd)
    expect(bad.ok).toBe(false)
    expect(bad.errors.some(e => e.includes('reference state "Nonexistent" is not a view state'))).toBe(true)
  })

  it('rejects a reference state on a resource that is not a Screen', () => {
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
    const entities = join(cwd, '.businesslens', 'entities')

    // A wrong extension, or an expanded folder that forgot its own file, used
    // to vanish with no finding at all.
    writeFileSync(join(entities, 'draft.txt'), '# Draft\n')
    mkdirSync(join(entities, 'courier'), { recursive: true })

    const result = run(cwd)
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('entities/draft.txt: expected <id>.md or <id>/entity.md')
    expect(result.errors).toContain('entities/courier/ is missing entity.md')
  })

  it('rejects duplicate compact and expanded shapes for one resource', () => {
    const cwd = fixtureCopy()
    writeResource(
      join(cwd, '.businesslens/entities/shopper/entity.md'),
      readFileSync(join(cwd, '.businesslens/entities/shopper.md'), 'utf8')
    )

    expect(run(cwd).errors).toContain(
      'entities/shopper: both shopper.md and shopper/entity.md exist; keep exactly one resource shape'
    )
  })

  it('warns rather than fails on an expanded resource that owns nothing yet', () => {
    const cwd = fixtureCopy()
    expandResource(
      join(cwd, '.businesslens/entities/shopper.md'),
      join(cwd, '.businesslens/entities/shopper/entity.md')
    )
    const result = run(cwd)

    // An author reaches the expanded shape in two steps, and the model is
    // loadable throughout. The rule still holds — expansion normalizes the
    // folder back to the compact form — so it is reported, but it does not
    // fail a model that is otherwise correct.
    expect(result.warnings).toContain(
      'entities/shopper/ has no assets or child resources; use entities/shopper.md'
    )
    expect(result.errors).not.toContain(
      'entities/shopper/ has no assets or child resources; use entities/shopper.md'
    )
    expect(result.ok).toBe(true)
  })

  it('accepts compact Product and expands a resource for its first asset', () => {
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
    expandResource(compactScreen, expandedScreen)
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

  it('rejects an unrecognized child directory inside a resource folder', () => {
    const cwd = fixtureCopy()
    mkdirSync(join(cwd, '.businesslens', 'capabilities', 'place-order', 'notes'), { recursive: true })
    expect(run(cwd).errors).toContain('capabilities/place-order/notes/ is not a recognized child directory')
  })

  it('passes the golden fixture', () => {
    const result = run(fixtureCopy())
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.ok).toBe(true)
    expect(result.counts).toEqual({
      interfaces: 5,
      experiences: 2,
      screens: 6,
      domains: 1,
      entities: 8,
      capabilities: 6,
      capabilityScenarios: 12,
      journeys: 1,
      journeyScenarios: 2,
      businessRules: 12
    })
  })

  it('rejects historical folder schemas', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/config.yaml'), 'schema: 5\nsdd:\n  paths: []\n')
    expect(run(cwd).errors).toContain('config.yaml: schema 5 is not supported (expected 8)')
  })

  it('rejects unsupported future folder schemas explicitly', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/config.yaml'), 'schema: 99\nsdd:\n  paths: []\n')
    expect(run(cwd).errors).toContain('config.yaml: schema 99 is not supported (expected 8)')
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

  /*
   * There is one resource type for things. An Entity that acts says so with
   * `acts`, and with it `kind` — an Actor was always a person or a system, and
   * an Entity that acts without saying which would be a regression from the
   * Actor it replaces. A thing that does not act says nothing.
   */
  it('classifies an Entity that acts, and only one that acts', () => {
    const cwd = fixtureCopy()
    const admin = join(cwd, '.businesslens/entities/store-admin.md')
    const source = readFileSync(admin, 'utf8')

    writeFileSync(admin, source.replace('kind: person\n', ''))
    expect(run(cwd).errors.join('\n')).toContain('an Entity that acts needs "kind": person|system')

    writeFileSync(admin, source.replace('acts: internal\n', ''))
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('"kind" is only valid together with "acts"')
    // Without `acts` there is nothing kept and no state either, so it is not an Entity at all.
    expect(errors).toContain('an Entity needs "## Information kept", "## States", or "acts"')

    writeFileSync(admin, source.replace('kind: person', 'kind: robot').replace('acts: internal', 'acts: sideways'))
    const bad = run(cwd).errors.join('\n')
    expect(bad).toContain('kind "robot" must be person|system')
    expect(bad).toContain('acts "sideways" must be external|internal')
  })

  it('supports every person/system and external/internal combination', () => {
    const cwd = fixtureCopy()
    writeResource(join(cwd, '.businesslens/entities/partner-system.md'), `---
kind: system
acts: external
---

# Partner system

An external system that uses a supported integration.
`)
    writeResource(join(cwd, '.businesslens/entities/store-scheduler.md'), `---
kind: system
acts: internal
---

# Store scheduler

An internal system that initiates store operations.
`)
    // Acting is reason enough to exist, once something names them as actors.
    const cli = join(cwd, '.businesslens/interfaces/operator-cli.md')
    writeFileSync(cli, readFileSync(cli, 'utf8').replace('actors: [store-admin]', 'actors: [store-admin, partner-system, store-scheduler]'))
    expect(run(cwd).errors).toEqual([])
  })

  it('names facts, and refuses a bullet that is not one', () => {
    const cwd = fixtureCopy()
    const order = join(cwd, '.businesslens/entities/order.md')
    const source = readFileSync(order, 'utf8')

    writeFileSync(order, source.replace('- **Tax** — the tax charged', '- The tax charged'))
    expect(run(cwd).errors.join('\n')).toContain('fact "The tax charged" must read "**Name** — prose"')

    writeFileSync(order, source.replace('- **Tax** — the tax charged', '- **Subtotal** — the tax charged'))
    expect(run(cwd).errors.join('\n')).toContain('duplicate fact "Subtotal"')
  })

  it('resolves every actor reference to an Entity that acts', () => {
    const cwd = fixtureCopy()
    const cli = join(cwd, '.businesslens/interfaces/operator-cli.md')
    writeFileSync(cli, readFileSync(cli, 'utf8').replace('actors: [store-admin]', 'actors: [order]'))
    expect(run(cwd).errors.join('\n')).toContain('"order" does not act; an actor is an Entity with "acts" and "kind"')

    const scenario = join(cwd, '.businesslens/capabilities/browse-catalog/scenarios/browse-catalog.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace('actor: shopper', 'actor: ghost'))
    expect(run(cwd).errors.join('\n')).toContain('step 2: references missing entity "ghost"')
  })

  /*
   * A Product Step may name the Actor it is attributable to — the Product did
   * it for them — and a Business Rule reads it as "who did". An unattended
   * Scenario names nobody: its permission is a Rule's `unattended` grant.
   */
  it('lets a Product Step name who it is attributable to, and nobody in an unattended Scenario', () => {
    const cwd = fixtureCopy()
    const expiry = join(cwd, '.businesslens/capabilities/cancel-order/scenarios/expire-an-unpaid-order.md')
    writeFileSync(expiry, readFileSync(expiry, 'utf8').replace('    kind: product\n', '    kind: product\n    actor: store-admin\n'))
    expect(run(cwd).errors.join('\n')).toContain('an unattended Scenario names no actor')
  })

  it('requires an Actor Step rather than an actor attributed only to Product Steps', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/capabilities/browse-catalog/scenarios/browse-catalog.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace(
      '    kind: actor\n    actor: shopper\n',
      '    kind: product\n    actor: shopper\n'
    ))
    expect(run(cwd).errors.join('\n')).toContain(
      'needs at least one actor Step, or an unattended first condition Step'
    )
  })

  it('requires a Capability on a Journey Step that changes a thing', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-and-complete-checkout.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace('    capability: settle-payment\n', ''))
    expect(run(cwd).errors.join('\n')).toContain('step 3: a Journey Step that creates, changes or removes an Entity needs a "capability"')
  })

  it('refuses an Entity nothing touches', () => {
    const cwd = fixtureCopy()
    writeResource(join(cwd, '.businesslens/entities/ghost-thing.md'), `# Ghost thing

Lead.

## Information kept

- **Weight** — how heavy it is
`)
    expect(run(cwd).errors.join('\n')).toContain(
      'ghost-thing.md: no Step changes it, no Screen presents it, nothing names it as an actor, and no Rule reads it'
    )
  })

  it('allows Products with no Domains and no Screens', () => {
    const cwd = fixtureCopy()
    const bl = join(cwd, '.businesslens')
    rmSync(join(bl, 'domains'), { recursive: true })
    const walk = (directory: string, edit: (file: string) => void) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const full = join(directory, entry.name)
        if (entry.isDirectory()) walk(full, edit)
        else if (entry.name.endsWith('.md')) edit(full)
      }
    }
    // Stripping a lone `domain:` leaves an empty frontmatter block, which is not a shape.
    walk(bl, file => writeFileSync(file, readFileSync(file, 'utf8').replace(/^domain: .*\n/m, '').replace(/^---\n---\n\n?/, '')))

    // Every Screen goes, so every Context names its container instead, and the
    // one Rule scoped to a Screen loses its scope.
    for (const relative of [
      'interfaces/customer-web/screens',
      'interfaces/customer-web/experiences/storefront/screens',
      'interfaces/customer-mobile/experiences/storefront/screens',
      'interfaces/admin-web/screens'
    ]) {
      rmSync(join(bl, relative), { recursive: true })
    }
    for (const interfaceId of ['customer-web', 'customer-mobile']) {
      compactResource(
        join(bl, `interfaces/${interfaceId}/experiences/storefront/experience.md`),
        join(bl, `interfaces/${interfaceId}/experiences/storefront.md`)
      )
    }
    compactResource(join(bl, 'interfaces/admin-web/interface.md'), join(bl, 'interfaces/admin-web.md'))
    walk(bl, file => writeFileSync(file, readFileSync(file, 'utf8')
      .replaceAll('customer-web::catalog', 'customer-web::storefront')
      .replaceAll('::product-record', '')
      .replaceAll('::order-status', '')
      .replaceAll('admin-web::order-detail', 'admin-web')))
    const margin = join(bl, 'business-rules/margin-is-for-operators.md')
    writeFileSync(margin, readFileSync(margin, 'utf8').replace('    contexts:\n      - place: admin-web\n', ''))

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
    expandResource(
      join(cwd, '.businesslens/interfaces/operator-cli.md'),
      join(cwd, '.businesslens/interfaces/operator-cli/interface.md')
    )
    writeResource(
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
    // A second access mode is what makes the CLI a divided Interface; a lone
    // Experience for one audience through one access mode would be an error.
    writeResource(
      join(cwd, '.businesslens/interfaces/operator-cli/experiences/status-desk.md'),
      `---
actors: [store-admin]
access: public
entryPoints:
  - operator-cli: fixture-shop status
---

# Status desk

Read-only status an operator can query without a session.

## Capability boundary

Reads status only. It changes nothing.
`
    )
    for (const relative of [
      '.businesslens/capabilities/manage-orders/capability.md',
      '.businesslens/capabilities/manage-orders/scenarios/refund-order.md',
      '.businesslens/capabilities/manage-orders/scenarios/merge-duplicate-orders.md'
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
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replaceAll(
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
        .replace('    capability: settle-payment', '    capability: browse-catalog')
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
    expect(errors).toContain('"## Steps" is not allowed on this resource type')
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
    writeResource(
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
    rmSync(join(cwd, '.businesslens/capabilities/manage-orders/scenarios'), { recursive: true })
    compactResource(
      join(cwd, '.businesslens/capabilities/manage-orders/capability.md'),
      join(cwd, '.businesslens/capabilities/manage-orders.md')
    )

    expect(run(cwd).errors.join('\n')).toContain('availability Context place "operator-cli" needs Capability Scenario coverage')

    const coverage = join(cwd, '.businesslens/coverage.md')
    writeFileSync(coverage, readFileSync(coverage, 'utf8').replace('status: complete', 'status: partial'))
    const partial = run(cwd)
    expect(partial.errors.some(error => error.includes('needs Capability Scenario coverage'))).toBe(false)
    expect(partial.warnings.some(warning => warning.includes('needs Capability Scenario coverage'))).toBe(true)
  })

  /*
   * The one rule that asks for `entity`/`state` on a Step. Every other check
   * validates the pair once it is there, which is how three shipped models came
   * to declare lifecycles their Scenarios never demonstrated.
   */
  /*
   * The Entity declares its states and nothing about the moves between them.
   * The lifecycle is composed from every Scenario, and the composition says
   * what it is missing: a state nothing produces, and an origin nothing
   * produced. The first listed state is where a thing starts, so it is
   * reachable by construction.
   */
  it('composes the lifecycle from Steps and reports what it is missing', () => {
    const cwd = fixtureCopy()
    const order = join(cwd, '.businesslens/entities/order.md')
    writeFileSync(order, `${readFileSync(order, 'utf8')}
### Archived

Filed away.
`)
    const merge = join(cwd, '.businesslens/capabilities/manage-orders/scenarios/merge-duplicate-orders.md')
    writeFileSync(merge, readFileSync(merge, 'utf8').replace(
      'as: duplicate, effect: changes, from: Pending, to: Cancelled',
      'as: duplicate, effect: changes, from: Archived, to: Cancelled'
    ))

    const result = run(cwd)
    expect(result.errors).toEqual([])
    expect(result.warnings.join('\n')).toContain('order.md: no Step leaves it in "Archived"')
    expect(result.warnings.join('\n')).toContain('moves it from "Archived", which no Step produces')
  })

  /*
   * A Step whose text names a thing it does not declare is the silence the
   * `entities` key exists to end. Titles only, and the Step's own actor and
   * "The Product" are exempt.
   */
  it('grades a Step whose text names an Entity it does not declare', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/capabilities/browse-catalog/scenarios/browse-catalog.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace(
      'text: The catalog is listed',
      'text: The catalog is listed beside any refunds the shopper has'
    ))
    expect(run(cwd).errors.join('\n')).toContain(
      'browse-catalog.md: step 1: text names "Refund" and "entities" does not declare it'
    )
    // "the shopper" is the Step's actor on step 2 only; on step 1 it is another Entity named and undeclared.
    expect(run(cwd).errors.join('\n')).toContain('step 1: text names "Shopper" and "entities" does not declare it')

    const coverage = join(cwd, '.businesslens/coverage.md')
    writeFileSync(coverage, readFileSync(coverage, 'utf8').replace('status: complete', 'status: partial'))
    const partial = run(cwd)
    expect(partial.errors.some(error => error.includes('does not declare it'))).toBe(false)
    expect(partial.warnings.some(warning => warning.includes('does not declare it'))).toBe(true)
  })

  /*
   * A title inside a longer declared title is covered by it: "Catalog product"
   * declared says nothing about "Catalog". And "the Product" is the Product in
   * any case, mid-sentence as much as at the start.
   */
  it('reads a shorter title inside a declared longer one as the longer one', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/entities/catalog.md'), '# Catalog\n\nThe shelf.\n\n## Information kept\n\n- **Name** — what it is called\n')
    writeFileSync(join(cwd, '.businesslens/entities/product.md'), '# Product\n\nThe whole thing.\n\n## Information kept\n\n- **Name** — what it is called\n')
    const scenario = join(cwd, '.businesslens/capabilities/browse-catalog/scenarios/browse-catalog.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace(
      'text: The catalog is listed',
      'text: The Catalog product list is shown, and the Product keeps it current'
    ))
    const findings = [...run(cwd).errors, ...run(cwd).warnings].join('\n')
    expect(findings).not.toContain('browse-catalog.md: step 1: text names "Catalog"')
    expect(findings).not.toContain('browse-catalog.md: step 1: text names "Product"')
    // Elsewhere, "the catalog" is still a Catalog nobody declared.
    expect(findings).toContain('text names "Catalog"')
  })

  /*
   * A Step names the state it leaves the Entity in and never the one it came
   * from, so two transitions into one state share a demonstration. Demanding a
   * witness per edge would demand a `from` the format never gives a Step.
   */
  /*
   * Where an earlier Step left an instance in a state, a later Step leaves
   * from it — and the way out of a false alarm is an alias, never a guess.
   */
  it('chains Steps per instance and points at aliases', () => {
    const cwd = fixtureCopy()
    const refund = join(cwd, '.businesslens/capabilities/manage-orders/scenarios/refund-order.md')
    const source = readFileSync(refund, 'utf8')
    writeFileSync(refund, source.replace(
      '      - { entity: order, effect: reads }',
      '      - { entity: order, effect: changes, from: Pending, to: Confirmed }'
    ).replace('from: Confirmed, to: Refunded', 'from: Pending, to: Refunded'))
    expect(run(cwd).errors.join('\n')).toContain(
      '"order" was left in "Confirmed" by an earlier Step, not "Pending"; if these are different instances, give them aliases'
    )

    const merge = join(cwd, '.businesslens/capabilities/manage-orders/scenarios/merge-duplicate-orders.md')
    writeFileSync(merge, readFileSync(merge, 'utf8').replace(
      '{ entity: order, as: duplicate, effect: changes, from: Pending, to: Cancelled }',
      '{ entity: order, effect: changes, from: Pending, to: Cancelled }'
    ))
    expect(run(cwd).errors.join('\n')).toContain(
      '"order" is aliased elsewhere in this Scenario; once an Entity is aliased, every mention of it is'
    )
  })

  /*
   * The other end of "capability X does not declare entity Y". That check runs
   * when a Step names an Entity; nothing ran when a Capability named one and no
   * Step ever did, so a Capability could declare what it changes while its whole
   * acceptance surface stayed silent about it.
   *
   * It asks whether the surface says anything, never whether it accounts for
   * each declared Entity: `entities` is what a Capability *can* change and a
   * Step's `changes` is what one concrete case *does*, so the two differ by
   * design.
   */
  it('refuses the retired Capability entities list, and names the replacement', () => {
    const cwd = fixtureCopy()
    const capability = join(cwd, '.businesslens/capabilities/browse-catalog/capability.md')
    writeFileSync(capability, readFileSync(capability, 'utf8').replace('---\n', '---\nentities:\n  - catalog-product\n'))
    expect(run(cwd).errors.join('\n')).toContain('"entities" is gone from a Capability; each Step\'s "entities" says what it changes')
  })

  /*
   * The rule that would force a false claim if it asked for more. A Capability
   * that writes any part of a model can touch every resource type while no
   * single acceptance case touches all of them.
   */
  it('requires entities on every Step, so silence is impossible', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/capabilities/browse-catalog/scenarios/browse-catalog.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace(
      '    entities:\n      - { entity: catalog-product, effect: reads }\n    contexts:\n      web:\n        place: customer-web::catalog\n      mobile:\n        place: customer-mobile::storefront::product-record\n  - text: The shopper opens',
      '    contexts:\n      web:\n        place: customer-web::catalog\n      mobile:\n        place: customer-mobile::storefront::product-record\n  - text: The shopper opens'
    ))
    expect(run(cwd).errors.join('\n')).toContain('step 1: needs "entities" — what this Step does to the Product\'s things, or [] when it touches nothing')
  })

  it('refuses the retired transitions key on an Entity, and the earlier Step spellings', () => {
    const cwd = fixtureCopy()
    const order = join(cwd, '.businesslens/entities/order.md')
    writeFileSync(order, readFileSync(order, 'utf8').replace('domain: ordering', 'domain: ordering\ntransitions:\n  - { from: Pending, to: Confirmed, by: settle-payment }'))
    expect(run(cwd).errors.join('\n')).toContain('"transitions" is gone; a Step\'s "entities" entry says which state it moves the thing from and to')

    const scenario = join(cwd, '.businesslens/capabilities/browse-catalog/scenarios/browse-catalog.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8').replace('    entities:\n', '    reads:\n      - catalog-product\n    entities:\n'))
    expect(run(cwd).errors.join('\n')).toContain('"reads" is now an entry of "entities"')
  })

  /*
   * A read is a bare mention. It resolves like any other reference, and reading
   * and changing one thing in one act are two claims that cannot both be the
   * whole truth about that Step.
   */
  /*
   * A read is a bare mention. It resolves like any other reference, and it
   * never keeps an Entity from being an orphan.
   */
  it('resolves a Step read like any other reference', () => {
    const cwd = fixtureCopy()
    const scenario = join(cwd, '.businesslens/capabilities/browse-catalog/scenarios/browse-catalog.md')
    const source = readFileSync(scenario, 'utf8')

    writeFileSync(scenario, source.replace('{ entity: catalog-product, effect: reads }', '{ entity: ghost, effect: reads }'))
    expect(run(cwd).errors.join('\n')).toContain('step 1: references missing entity "ghost"')

    writeFileSync(scenario, source)
    expect(run(cwd).errors).toEqual([])
  })

  it('refuses two entries for one instance, and state keys an effect cannot carry', () => {
    const cwd = fixtureCopy()
    const refund = join(cwd, '.businesslens/capabilities/manage-orders/scenarios/refund-order.md')
    const source = readFileSync(refund, 'utf8')
    const withEntry = (entry: string) => {
      writeFileSync(refund, source.replace(
        '      - { entity: refund, effect: creates, to: Requested }',
        `      - { entity: refund, effect: creates, to: Requested }\n      - ${entry}`
      ))
      return run(cwd).errors.join('\n')
    }

    expect(withEntry('{ entity: refund, effect: reads }')).toContain('"refund" already appears in this Step')
    expect(withEntry('{ entity: cart, effect: reads, to: Full }')).toContain('a "reads" entry carries no "from" or "to"')
    expect(withEntry('{ entity: cart, effect: creates, from: Empty }')).toContain('a "creates" entry has no "from"')
    expect(withEntry('{ entity: cart, effect: removes, to: Empty }')).toContain('a "removes" entry has no "to"')
    expect(withEntry('{ entity: cart, effect: changes, to: Full }')).toContain('a "changes" entry carries both "from" and "to", or neither')
    expect(withEntry('{ entity: cart, effect: changes, from: Full, to: Empty }')).toContain('names a state, and entity "cart" declares none')
    expect(withEntry('{ entity: catalog-product, effect: creates }')).toContain('creating "catalog-product" needs "to", the state it starts in')
    expect(withEntry('{ entity: catalog-product, effect: removes }')).toContain('removing "catalog-product" needs "from", the state it ends in')
    expect(withEntry('{ entity: catalog-product, effect: changes, from: Available, to: Sold }')).toContain('"Sold" is not a state of entity "catalog-product"')
  })

  it('requires Capability Scenario coverage for every availability Context', () => {
    const cwd = fixtureCopy()
    for (const name of ['complete-checkout', 'decline-checkout-payment', 'sell-the-last-available-unit']) {
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
    const file = join(cwd, '.businesslens/business-rules/payment-before-confirmation.md')
    writeFileSync(file, readFileSync(file, 'utf8').replace(
      'appliesTo:\n  - type: entity\n    id: order\n    effect: changes\n    to: Confirmed',
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
    const file = join(cwd, '.businesslens/business-rules/payment-before-confirmation.md')
    const source = readFileSync(file, 'utf8').replace(
      'appliesTo:\n  - type: entity\n    id: order\n    effect: changes\n    to: Confirmed',
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
      .replace('## Success criterion', '## Outcome\n\nWrong resource shape.\n\n## Success criterion'))

    const scenario = join(cwd, '.businesslens/capabilities/place-order/scenarios/complete-checkout.md')
    writeFileSync(scenario, readFileSync(scenario, 'utf8')
      .replace('# Complete checkout\n\n## Trigger', '# Complete checkout\n\nLegacy Scenario summary.\n\n## Trigger')
      .replace('## Outcome', '## Goal\n\nWrong resource shape.\n\n## Trigger\n\nDuplicate trigger.\n\n## Outcome')
      .replace(
        'The order is stored as pending, awaiting settlement, and a confirmation is shown.',
        'The order is stored as pending, awaiting settlement, and a confirmation is shown.\n\n## Edge cases\n\nNot a bullet item.'
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
    expect(errors).toContain('"## Outcome" is not allowed on this resource type')
    expect(errors).toContain('duplicate "## Trigger" section')
    expect(errors).toContain('"## Goal" is not allowed on this resource type')
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

## View states

### Empty

## Capability boundary
`)
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('needs at least one capability')
    expect(errors).toContain('unknown frontmatter key "availability"')
    expect(errors).toContain('unknown frontmatter key "capabilityScenarios"')
    expect(errors).toContain('unknown frontmatter key "journeyScenarios"')
    expect(errors).toContain('"## Information presented" needs at least one bullet item')
    expect(errors).toContain('view state "Empty" needs a description')
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

  it('reads a Screen shared beside experiences/ as inside every Experience of its Interface', () => {
    const cwd = fixtureCopy()
    // The fixture shares customer-web::catalog beside the storefront Experience.
    // A second Experience that browse-catalog is not available in breaks both
    // the Screen and the Step that occurs on it, and names what is missing.
    writeResource(join(cwd, '.businesslens/interfaces/customer-web/experiences/account/experience.md'), `---
actors: [shopper]
access: authenticated
entryPoints:
  - customer-web: /account
---

# Account

Lead.

## Capability boundary

Orders only.
`)
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain(
      'catalog.md: capability "browse-catalog" must be available in every Experience of "customer-web", which shares this Screen; missing "customer-web::account"'
    )
    expect(errors).toContain('Context place "customer-web::catalog" is outside capability "browse-catalog"')

    // Offering the Capability in every Experience settles both, and the Step on
    // the shared Screen covers the new Experience without a Step of its own.
    const capability = join(cwd, '.businesslens/capabilities/browse-catalog/capability.md')
    writeFileSync(
      capability,
      readFileSync(capability, 'utf8').replace(
        '{ place: customer-web::storefront }, ',
        '{ place: customer-web::storefront }, { place: customer-web::account }, '
      )
    )
    const settled = run(cwd).errors.join('\n')
    expect(settled).not.toContain('which shares this Screen')
    expect(settled).not.toContain('outside capability "browse-catalog"')
    expect(settled).not.toContain('availability Context place "customer-web::account" needs Capability Scenario coverage')
  })

  it('checks Screen reads only against Rules that can select a read', () => {
    const cwd = fixtureCopy()
    // A target with `to` selects a state move; a read carries no state, so it
    // never governs what a Screen presents.
    writeRule(cwd, 'only-an-operator-lands-refunded', `appliesTo:
  - type: entity
    id: order
    to: Refunded
permits:
  - actors: [store-admin]`)
    expect(run(cwd).errors.filter(error => error.includes('has a grant to read it'))).toEqual([])

    // A read-governing Rule with no grant for the shopper still fails the
    // shopper Screens that present an Order.
    writeRule(cwd, 'only-operators-read-orders', `appliesTo:
  - type: entity
    id: order
    effect: reads
permits:
  - actors: [store-admin]`)
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('order-status.md: presents "order", and no actor of "customer-web::storefront" has a grant to read it in rule "only-operators-read-orders"')
  })

  it('divides an Interface only when no available Capability bridges its audiences, as an error', () => {
    const cwd = fixtureCopy()
    const adminWeb = join(cwd, '.businesslens/interfaces/admin-web/interface.md')
    // admin-web now serves shoppers too; manage-orders is reached by the admin,
    // cancel-order by the shopper, and nothing bridges them. (The fixture's
    // admin-cancels-a-paid-order Scenario would bridge them, so it goes.)
    unlinkSync(join(cwd, '.businesslens/capabilities/cancel-order/scenarios/cancel-a-paid-order-before-fulfilment.md'))
    writeFileSync(adminWeb, readFileSync(adminWeb, 'utf8').replace('actors: [store-admin]', 'actors: [store-admin, shopper]'))
    const disjoint = run(cwd)
    expect(disjoint.errors).toContain(
      `${adminWeb}: serves Actor sets no available Capability bridges; these are Experiences, not one context`
    )

    // A Capability both audiences use joins them into one context.
    writeResource(join(cwd, '.businesslens/capabilities/review-orders/capability.md'), `---
domain: ordering
availability: [{ place: admin-web }]
---

# Review orders

Lets an operator and the shopper look at a disputed order together.
`)
    writeResource(join(cwd, '.businesslens/capabilities/review-orders/scenarios/review-an-order-together.md'), `---
kind: primary
routes:
  web: Web
steps:
  - text: The admin opens the disputed order
    kind: actor
    actor: store-admin
    entities:
      - { entity: order, effect: reads }
    contexts:
      web:
        place: admin-web::order-detail
  - text: The shopper confirms the items listed are what they received
    kind: actor
    actor: shopper
    entities:
      - { entity: order, effect: reads }
    contexts:
      web:
        place: admin-web::order-detail
---

# Review an order together

## Trigger

A shopper disputes an order with an operator.

## Outcome

Both have looked at the same order record.
`)
    const screen = join(cwd, '.businesslens/interfaces/admin-web/screens/order-detail.md')
    writeFileSync(screen, readFileSync(screen, 'utf8').replace('  - manage-orders\n', '  - manage-orders\n  - review-orders\n'))
    const bridged = run(cwd)
    expect(bridged.errors.filter(error => error.includes('no available Capability bridges'))).toEqual([])
  })

  it('flags a ceremonial Experience as an error, unless it is a counterpart', () => {
    const cwd = fixtureCopy()
    // As authored, customer-web's single storefront Experience is justified by
    // customer-mobile's counterpart. Rename the mobile one and both stand alone.
    const bl = join(cwd, '.businesslens')
    renameSync(join(bl, 'interfaces/customer-mobile/experiences/storefront'), join(bl, 'interfaces/customer-mobile/experiences/shop'))
    const walk = (directory: string) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const full = join(directory, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith('.md')) {
          writeFileSync(full, readFileSync(full, 'utf8').replaceAll('customer-mobile::storefront', 'customer-mobile::shop'))
        }
      }
    }
    walk(bl)
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('interfaces/customer-web/interface.md: holds Experiences but serves one audience through one access mode, and none is a counterpart; use direct Interface availability')
    expect(errors).toContain('interfaces/customer-mobile/interface.md: holds Experiences but serves one audience through one access mode, and none is a counterpart')
  })

  it('reads a word the model declares as a thing, not as a verb, in id vocabulary checks', () => {
    const cwd = fixtureCopy()
    const bl = join(cwd, '.businesslens')
    const entity = (id: string, title: string) => writeResource(join(bl, `entities/${id}.md`), `---
---

# ${title}

Lead.

## Information kept

- **Quantity** — how many
`)
    // `order` and `refund` name Entities here, so these open with a noun.
    entity('order-line', 'Order line')
    entity('refund-request', 'Refund request')
    // `ship` names nothing in this model, so this one does open with a verb.
    entity('ship-manifest', 'Ship manifest')
    // The spec's own counter-example: `order` is a thing, so the id carries no verb.
    cpSync(join(bl, 'capabilities/manage-orders'), join(bl, 'capabilities/order-management'), { recursive: true })
    // Scenarios are behavioural ids too.
    cpSync(join(bl, 'capabilities/manage-orders/scenarios/refund-order.md'), join(bl, 'capabilities/manage-orders/scenarios/refund-processing.md'))

    const warnings = run(cwd).warnings.join('\n')
    expect(warnings).not.toContain('"order-line" opens with a verb')
    expect(warnings).not.toContain('"refund-request" opens with a verb')
    expect(warnings).toContain('Entity id "ship-manifest" opens with a verb')
    expect(warnings).toContain('Capability id "order-management" reads as a noun phrase')
    expect(warnings).toContain('Capability Scenario id "refund-processing" reads as a noun phrase')
  })

  it('warns on a Rule that governs exactly one behaviour with no narrowing', () => {
    const cwd = fixtureCopy()
    writeRule(cwd, 'orders-are-merged-by-hand', `appliesTo:
  - type: capability
    id: manage-orders`)
    expect(run(cwd).warnings.join('\n')).toContain(
      'orders-are-merged-by-hand.md: governs only "manage-orders"; a constraint true of one behavior belongs to it as a condition Step or Outcome, not a Business Rule'
    )
  })

  it('requires a Domain Boundary to say what the Domain does not own', () => {
    const cwd = fixtureCopy()
    const domain = join(cwd, '.businesslens/domains/ordering.md')
    const source = readFileSync(domain, 'utf8')
    const boundaryAt = source.indexOf('## Boundary')
    writeFileSync(domain, `${source.slice(0, boundaryAt)}## Boundary\n\nEverything about orders, from cart to fulfilment.\n`)
    expect(run(cwd).errors.join('\n')).toContain(
      'ordering.md: "## Boundary" must state what the Domain does not own, not only what it covers'
    )
  })

  it('refuses an actors/ collection and names the replacement', () => {
    const cwd = fixtureCopy()
    writeResource(join(cwd, '.businesslens/actors/shopper.md'), '---\nkind: person\n---\n\n# Shopper\n\nLead.\n')
    expect(run(cwd).errors.join('\n')).toContain(
      'actors/: there is no Actor resource type; move each file to entities/ and say how it acts with "kind" and "acts"'
    )
  })

  it('resolves configuredBy on a grant and on a threshold', () => {
    const cwd = fixtureCopy()
    writeRule(cwd, 'large-refunds-are-approved', `appliesTo:
  - type: entity
    id: order
    effect: changes
    to: Refunded
permits:
  - configuredBy: approval-policy
    when: [{ fact: Total charged, over: { configuredBy: approval-policy } }]`)
    const errors = run(cwd).errors.join('\n')
    expect(errors).toContain('grant 1: "configuredBy" references missing entity "approval-policy"')
    expect(errors).toContain('condition 1: "configuredBy" references missing entity "approval-policy"')
  })

  it('keys an entry point by the Interface type or another Interface id, never an unknown surface', () => {
    const cwd = fixtureCopy()
    const cli = join(cwd, '.businesslens/interfaces/operator-cli.md')
    const source = readFileSync(cli, 'utf8')
    // A reader may arrive at the CLI's report from the admin site: another Interface's id is a valid key.
    writeFileSync(cli, source.replace('entryPoints:\n', 'entryPoints:\n  - admin-web: /admin/tools/cli\n'))
    expect(run(cwd).errors.filter(error => error.includes('entry point'))).toEqual([])

    writeFileSync(cli, source.replace('entryPoints:\n', 'entryPoints:\n  - kiosk: /kiosk\n'))
    expect(run(cwd).errors.join('\n')).toContain('operator-cli.md: entry point key "kiosk" must be this Interface\'s type "cli" or another Interface\'s id')
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
    expect(errors).toContain('references missing entity "ghost"')
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
    writeResource(join(cwd, '.businesslens/journeys/browse-and-buy/scenarios/browse-catalog.md'), `---
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
    writeFileSync(join(cwd, '.businesslens/entities/shopper.md'), shopperWith(`references:
  - kind: doc
    role: context
    target: docs/missing.md`))
    const result = run(cwd)
    expect(result.ok).toBe(true)
    expect(result.warnings.some(warning => warning.includes('docs/missing.md'))).toBe(true)
  })

  it('checks the local path behind a reference query or fragment', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/entities/shopper.md'), shopperWith(`references:
  - kind: research
    role: context
    target: README.md?plain=1#method`))
    const result = run(cwd)
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('rejects unsafe supporting-reference schemes', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/entities/shopper.md'), shopperWith(`references:
  - kind: visual
    role: intent
    target: file:///tmp/screen.png`))
    expect(run(cwd).errors.join('\n')).toContain('must use HTTP(S) or a repository-relative path')
  })

  it('rejects duplicate reference targets on one resource', () => {
    const cwd = fixtureCopy()
    writeFileSync(join(cwd, '.businesslens/entities/shopper.md'), shopperWith(`references:
  - kind: doc
    role: context
    target: https://example.com/same
  - kind: visual
    role: intent
    target: https://example.com/same`))
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

  /*
   * Entity was added as a kind without joining the generic "for every resource"
   * lists, so its ids, References and assets went unchecked for a release. These
   * cover the checks an Entity now shares with every other resource.
   */
  it('checks an Entity like every other resource: ids, References and assets', () => {
    const cwd = fixtureCopy()
    const order = join(cwd, '.businesslens/entities/order.md')
    const source = readFileSync(order, 'utf8')

    const withRefs = (block: string) => {
      writeFileSync(order, source.replace('domain: ordering', `domain: ordering\n${block}`))
      return run(cwd)
    }

    expect(withRefs(`references:
  - kind: doc
    role: context
    target: docs/nowhere.md`).warnings.join('\n'))
      .toContain('reference target "docs/nowhere.md" does not exist in the repository')

    expect(withRefs(`references:
  - kind: code
    role: implementation
    target: src/models/order.ts
  - kind: doc
    role: context
    target: src/models/order.ts`).errors.join('\n'))
      .toContain('duplicate reference target "src/models/order.ts"')

    expect(withRefs(`references:
  - kind: code
    role: implementation
    target: src/models/order.ts
    state: Pending`).errors.join('\n'))
      .toContain('reference "state" is only valid on a Screen')

    // The tracked code target is real, so a clean list is accepted.
    writeFileSync(order, source.replace('domain: ordering', `domain: ordering
references:
  - kind: code
    role: implementation
    target: src/models/order.ts`))
    expect(run(cwd).errors).toEqual([])

    writeFileSync(order, source)
    renameSync(order, join(cwd, '.businesslens/entities/Order.md'))
    expect(run(cwd).errors.join('\n')).toContain('id "Order" must be lowercase kebab-case')
  })

  it('refuses a prose section that restates frontmatter on an Entity', () => {
    const cwd = fixtureCopy()
    const order = join(cwd, '.businesslens/entities/order.md')
    for (const heading of ['Transitions', 'Relations']) {
      writeFileSync(order, `${readFileSync(order, 'utf8')}\n## ${heading}\n\nSomething restated in prose.\n`)
      expect(run(cwd).errors.join('\n')).toContain(`"## ${heading}" is not allowed on this resource type`)
      writeFileSync(order, readFileSync(order, 'utf8').replace(`\n## ${heading}\n\nSomething restated in prose.\n`, ''))
    }
  })

  /*
   * `cardinality: many` said only the target end, so an author who needed the
   * other one wrote the relationship twice facing itself — which is what the
   * Content Feed Reader Blueprint did.
   */
  it('takes both relation ends, and refuses the direction that would duplicate an encoding', () => {
    const cwd = fixtureCopy()
    const order = join(cwd, '.businesslens/entities/order.md')
    const source = readFileSync(order, 'utf8')

    const withCardinality = (value: string) => {
      writeFileSync(order, source.replace('cardinality: many-to-many', `cardinality: ${value}`))
      return run(cwd)
    }

    expect(withCardinality('many').errors.join('\n'))
      .toContain('"cardinality" must be one-to-one, one-to-many, or many-to-many')
    expect(withCardinality('many-to-one').errors.join('\n'))
      .toContain('declare this relation on "catalog-product", where it reads one-to-many')
    for (const value of ['one-to-one', 'one-to-many', 'many-to-many']) {
      expect(withCardinality(value).errors).toEqual([])
    }
  })

  it('warns when two Entities declare relations at each other', () => {
    const cwd = fixtureCopy()
    const product = join(cwd, '.businesslens/entities/catalog-product.md')
    writeFileSync(product, `---
relations:
  - entity: order
    verb: was ordered in
    cardinality: many-to-many
---

${readFileSync(product, 'utf8')}`)
    const result = run(cwd)
    expect(result.errors).toEqual([])
    expect(result.warnings.join('\n')).toContain('faces "was ordered in order"')
  })

  /*
   * A surface reached from another surface had nowhere to say so: an Interface
   * key had to equal its own type, so a web report opened by a command could
   * only record that in prose.
   */
  it('keys an Interface entry point by its own type or by another Interface', () => {
    const cwd = fixtureCopy()
    const file = join(cwd, '.businesslens/interfaces/customer-web/interface.md')
    const source = readFileSync(file, 'utf8')
    const withKey = (key: string) => {
      writeFileSync(file, source.replace('entryPoints:\n', `entryPoints:\n  - ${key}: somewhere\n`))
      return run(cwd)
    }

    expect(withKey('operator-cli').errors).toEqual([])
    expect(withKey('customer-web').errors.join('\n'))
      .toContain('is this Interface\'s own id; use its type "web"')
    expect(withKey('nonsense').errors.join('\n'))
      .toContain('must be this Interface\'s type "web" or another Interface\'s id')
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

  /*
   * `permits` is checked for structure: every id resolves, every path walks one
   * unambiguous hop at a time onto an Entity that acts, and no grant is
   * impossible by construction. Nothing here claims a grant is satisfied.
   */
  it('checks a permission Rule for structure', () => {
    const cwd = fixtureCopy()
    const errorsWith = (frontmatter: string) => {
      writeRule(cwd, 'probe', frontmatter)
      return run(cwd).errors.join('\n')
    }

    expect(errorsWith(`appliesTo:
  - type: capability
    id: manage-orders
permits:
  - actors: [store-admin]`)).toContain('"permits" needs Entity targets only')

    expect(errorsWith(`appliesTo:
  - type: entity
    id: refund
permits:
  - when: [{ fact: Amount, over: 10 }]`)).toContain('grant 1: names nobody')

    expect(errorsWith(`appliesTo:
  - type: entity
    id: refund
permits:
  - related: []`)).toContain('"related" is empty; the instance itself is "self: true"')

    expect(errorsWith(`appliesTo:
  - type: entity
    id: refund
permits:
  - related: [{ verb: belongs to, entity: order }]`)).toContain('no relation "belongs to" joins "refund" and "order" in either direction')

    expect(errorsWith(`appliesTo:
  - type: entity
    id: refund
permits:
  - related: [{ verb: is repaid by, entity: order }]`)).toContain('"related" ends on "order", which does not act')

    expect(errorsWith(`appliesTo:
  - type: entity
    id: refund
permits:
  - actors: [store-admin]
    related: [{ verb: is repaid by, entity: order }, { verb: owns, entity: shopper }]`)).toContain('"actors" excludes "shopper", where "related" ends; the grant can never be satisfied')

    expect(errorsWith(`appliesTo:
  - type: entity
    id: refund
permits:
  - related: [{ verb: is repaid by, entity: refund }]`)).toContain('walks "refund" to itself')

    expect(errorsWith(`appliesTo:
  - type: entity
    id: order
permits:
  - self: true`)).toContain('"self" needs entity "order" to act')

    expect(errorsWith(`appliesTo:
  - type: entity
    id: order
    effect: creates
permits:
  - actors: [shopper]
    when: [{ state: Pending }]`)).toContain('a "state" condition on a "creates" target; there is no instance yet')

    expect(errorsWith(`appliesTo:
  - type: entity
    id: order
permits:
  - actors: [shopper]
    when: [{ state: Shipped }, { fact: Weight, over: 1 }, { entity: store-settings, fact: Nope, is: true }]`))
      .toMatch(/"Shipped" is not a state of entity "order"[\s\S]*"Weight" is not a fact of entity "order"[\s\S]*"Nope" is not a fact of entity "store-settings"/)

    expect(errorsWith(`appliesTo:
  - type: entity
    id: order
permits:
  - actors: [shopper]
    when: [{ fact: Subtotal, over: 1, under: 2 }]`)).toContain('needs exactly one operator')

    expect(errorsWith(`appliesTo:
  - type: entity
    id: order
    effect: removes
    to: Cancelled
permits: []`)).toContain('"to" selects nothing on a "removes" target')

    expect(errorsWith(`appliesTo:
  - type: entity
    id: order
    effect: reads
    contexts:
      - place: customer-web::storefront::product-record
permits:
  - actors: [shopper]`)).toContain('Context place "customer-web::storefront::product-record" presents entity "order" nowhere')

    expect(errorsWith(`appliesTo:
  - type: entity
    id: order
  - type: entity
    id: refund
permits:
  - related: [{ verb: owns, entity: shopper }]
    when: [{ state: Pending }]`)).toMatch(/"related" needs exactly one Entity target[\s\S]*a "state" condition needs exactly one Entity target/)
  })

  it('walks a related path only where a hop is unambiguous', () => {
    const cwd = fixtureCopy()
    // A second relation with the same verb between the same pair, facing the other way.
    const refund = join(cwd, '.businesslens/entities/refund.md')
    writeFileSync(refund, readFileSync(refund, 'utf8').replace('domain: ordering', `domain: ordering
relations:
  - entity: order
    verb: is repaid by
    cardinality: one-to-one`))
    expect(run(cwd).errors.join('\n')).toContain('"is repaid by" joins "refund" and "order" more than once; give one of them another verb')
  })

  /*
   * A target selects a Step by the keys its `entities` entry carries; a grant
   * is possible for the Step's actor when every who-key it carries could be
   * that actor. Rules selecting one operation AND.
   */
  it('holds Steps to the Rules that govern them', () => {
    const cwd = fixtureCopy()
    const merge = join(cwd, '.businesslens/capabilities/manage-orders/scenarios/merge-duplicate-orders.md')
    writeFileSync(merge, readFileSync(merge, 'utf8').replace(
      'as: duplicate, effect: changes, from: Pending, to: Cancelled',
      'as: duplicate, effect: changes, from: Refunded, to: Cancelled'
    ))
    expect(run(cwd).errors.join('\n')).toContain(
      'step 2: moves "order (duplicate)" from Refunded to Cancelled, which rule "a-refunded-order-is-never-cancelled" forbids to everyone'
    )

    writeRule(cwd, 'gateway-only', `appliesTo:
  - type: entity
    id: order
    effect: changes
    to: Refunded
permits:
  - actors: [payment-gateway]`)
    expect(run(cwd).errors.join('\n')).toContain(
      'actor "store-admin" moves "order" from Confirmed to Refunded, and no grant of rule "gateway-only" can permit it'
    )
    unlinkSync(join(cwd, '.businesslens/business-rules/gateway-only.md'))

    const refund = join(cwd, '.businesslens/capabilities/manage-orders/scenarios/refund-order.md')
    const source = readFileSync(refund, 'utf8')
    writeFileSync(refund, source.replace('    kind: product\n    actor: store-admin\n', '    kind: product\n'))
    expect(run(cwd).errors.join('\n')).toContain(
      'step 2: moves "order" from Confirmed to Refunded, which rule "who-may-change-an-order" governs, so it needs an actor'
    )
    writeFileSync(refund, source)

    const rule = join(cwd, '.businesslens/business-rules/who-may-change-an-order.md')
    writeFileSync(rule, readFileSync(rule, 'utf8').replace('  - unattended: true\n    when: [{ state: Pending }]\n', ''))
    expect(run(cwd).errors.join('\n')).toContain(
      'moves "order" from Pending to Cancelled unattended, and rule "who-may-change-an-order" has no "unattended" grant for it'
    )
  })

  it('warns on selectors that say nothing', () => {
    const cwd = fixtureCopy()
    writeRule(cwd, 'twin', `appliesTo:
  - type: entity
    id: order
    effect: removes
permits: []`)
    expect(run(cwd).warnings.join('\n')).toMatch(/twin\.md: selects exactly what .*orders-are-never-deleted\.md selects/)
    unlinkSync(join(cwd, '.businesslens/business-rules/twin.md'))

    writeRule(cwd, 'narrow', `appliesTo:
  - type: entity
    id: order
    effect: changes
    from: Confirmed
    to: Refunded
permits:
  - actors: [store-admin]
    when: [{ state: Confirmed }]`)
    const warnings = run(cwd).warnings.join('\n')
    expect(warnings).toContain('"from: Confirmed" is redundant; every Step it could select already leaves from it')
    expect(warnings).toContain('"state: Confirmed" is redundant; every selected Step already leaves from it')
  })

  it('keeps a Screen readable by somebody who reaches it', () => {
    const cwd = fixtureCopy()
    writeRule(cwd, 'gateway-reads', `appliesTo:
  - type: entity
    id: refund
    effect: reads
permits:
  - actors: [payment-gateway]`)
    expect(run(cwd).errors.join('\n')).toContain(
      'presents "refund", and no actor of "customer-web::storefront" has a grant to read it in rule "gateway-reads"'
    )

    writeRule(cwd, 'gateway-reads', `appliesTo:
  - type: entity
    id: refund
    effect: reads
permits: []`)
    expect(run(cwd).errors.join('\n')).toContain('presents "refund", which rule "gateway-reads" forbids anyone to read')
  })

})
