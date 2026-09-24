import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'

const utility = (name: string) => import(`../layers/nuxt/report-viewer/app/utils/${name}.ts`)
const { projectReportWorkspace } = await utility('reportWorkspace')
const { screenSketch, containerSketch, storyboard, hasContainerSketch, SKETCH_FRAMES, SKETCH_DERIVATION, STORYBOARD_DERIVATION } = await utility('sketch')
const { tabsFor } = await utility('pageSections')

const shop = projectReportWorkspace(compileReport(loadModel(join(__dirname, 'fixtures', 'fixture-shop')), '2026-09-21'))
const reader = projectReportWorkspace(compileReport(loadModel(join(__dirname, '..', 'blueprints', 'content-feed-reader')), '2026-09-21'))

describe('Screen Sketch', () => {
  const sketch = screenSketch(shop, 'customer-web::storefront::product-record')

  it('frames a web Screen as a browser with its own entry point on the address line', () => {
    expect(sketch.frame).toMatchObject({ kind: 'browser', strip: 'top', entry: 'address', interfaceType: 'web' })
    expect(sketch.title).toBe('Product record')
    expect(sketch.entry).toEqual(['/products/:id'])
  })

  it('forms the strip from the container navigation, marking the current Screen only when it is in it', () => {
    expect(sketch.strip.map((item: any) => [item.title, item.current])).toEqual([['Catalog', false]])
    const catalog = screenSketch(shop, 'customer-web::catalog')
    expect(catalog.strip.map((item: any) => [item.title, item.current])).toEqual([['Catalog', true]])
  })

  it('draws one group per presented Entity, a field only for a fact a Step changes exactly here', () => {
    /* The report carries a Screen's entries in its own canonical order; the Sketch keeps it. */
    expect(sketch.groups.map((group: any) => group.title)).toEqual(['Cart', 'Catalog product', 'Shopper'])
    const shopper = sketch.groups.find((group: any) => group.entityId === 'shopper')
    expect(shopper.lines).toEqual([{ kind: 'field', label: 'Delivery address', lit: false }])
    for (const group of sketch.groups.filter((item: any) => item.entityId !== 'shopper')) {
      expect(group.lines.every((line: any) => line.kind === 'placeholder')).toBe(true)
      expect(group.note).toBeNull()
    }
    /* The mobile twin presents the same facts, and the checkout Step is placed there too. */
    const mobile = screenSketch(shop, 'customer-mobile::storefront::product-record')
    expect(mobile.frame.kind).toBe('phone')
    expect(mobile.groups.find((group: any) => group.entityId === 'shopper').lines[0].kind).toBe('field')
  })

  it('draws a bare entry as one unlabelled bar with a note', () => {
    const bare = reader.screens.find((screen: any) => screen.entities.some((entry: any) => entry.facts === null))
    if (!bare) return
    const group = screenSketch(reader, bare.id).groups.find((item: any) => item.note)
    expect(group.lines).toEqual([{ kind: 'bare', label: '', lit: false }])
    expect(group.note).toBe('facts not named')
  })

  it('draws one action per exposed Capability, dashed where no actor Step is placed here for it', () => {
    expect(sketch.actions.map((action: any) => [action.title, action.dashed])).toEqual([
      ['Catalog browsing', false],
      ['Checkout', false]
    ])
    const placing = sketch.actions[1]
    expect(placing.steps.every((step: any) => typeof step.index === 'number' && step.scenarioTitle)).toBe(true)
    expect(placing.steps.some((step: any) => step.text === 'The shopper confirms the delivery address')).toBe(true)
    /* Dashed means exactly "no actor Step placed here for it", on every Screen of both models. */
    const actions = [...shop.screens, ...reader.screens].flatMap((screen: any) =>
      screenSketch(screen.id === shop.screens.find((item: any) => item.id === screen.id)?.id ? shop : reader, screen.id).actions)
    expect(actions.length).toBeGreaterThan(0)
    expect(actions.some((action: any) => action.dashed)).toBe(true)
    for (const action of actions) expect(action.dashed).toBe(action.steps.length === 0)
  })

  it('orders tabs by the first route that walks two children in sequence, else authored order', () => {
    const workspace = screenSketch(reader, 'reader-web::personal-library::collection-workspace')
    expect(workspace.tabs.map((tab: any) => tab.screenId.split('::').at(-1))).toEqual(['items', 'settings'])
    const wizard = screenSketch(reader, 'reader-web::personal-library::add-source')
    expect(wizard.tabs.map((tab: any) => tab.screenId.split('::').at(-1))).toEqual(['feed-address', 'confirm'])
    expect(reader.screens.find((screen: any) => screen.id === 'reader-web::personal-library::add-source').childScreenIds
      .map((id: string) => id.split('::').at(-1))).toEqual(['confirm', 'feed-address'])
  })

  it('returns null for an unknown Screen', () => {
    expect(screenSketch(shop, 'nowhere')).toBeNull()
  })
})

describe('Container Sketch', () => {
  it('puts the always-reachable Screens of a web Interface in its top strip and its Screens on a wall', () => {
    const web = containerSketch(shop, 'customer-web')
    expect(web.frame.kind).toBe('browser')
    expect(web.entry).toEqual(['/'])
    expect(web.strip.map((item: any) => item.screenId)).toEqual(['customer-web::catalog'])
    expect(web.listing).toEqual([])
    expect(web.wall.map((group: any) => [group.title, group.miniatures.map((item: any) => item.title)])).toEqual([
      ['Shared Screens', ['Catalog']],
      ['Shopping', ['Order status', 'Product record']]
    ])
    const record = web.wall[1].miniatures[1]
    expect(record).toMatchObject({ groupLabels: ['Cart', 'Catalog product', 'Shopper'], actionCount: 2, tabs: [] })
  })

  it('frames a mobile Interface as a phone with search in the bottom tab bar', () => {
    const mobile = containerSketch(reader, 'reader-mobile')
    expect(mobile.frame).toMatchObject({ kind: 'phone', strip: 'bottom', entry: 'deep-link' })
    expect(mobile.strip.map((item: any) => item.screenId)).toEqual(['reader-mobile::search'])
    expect(mobile.wall[0].title).toBe('Shared Screens')
    expect(mobile.wall.map((group: any) => group.experienceId)).toEqual(['', 'reader-mobile::personal-library', 'reader-mobile::personal-library-next'])
    /* A nested Screen appears on its parent's miniature, never on the wall. */
    const next = mobile.wall[2].miniatures.find((item: any) => item.screenId.endsWith('::unread-library'))
    expect(next.tabs.map((tab: any) => tab.screenId.split('::').at(-1))).toEqual(['by-source'])
    expect(mobile.wall.flatMap((group: any) => group.miniatures).some((item: any) => item.screenId.endsWith('::by-source'))).toBe(false)
  })

  it('an Experience wall is one unlabelled group with its own strip merged from the Interface', () => {
    const library = containerSketch(reader, 'reader-web::personal-library')
    expect(library.wall).toHaveLength(1)
    expect(library.wall[0].title).toBe('')
    expect(library.wall[0].miniatures.map((item: any) => item.screenId.split('::').at(-1)))
      .toEqual(['add-source', 'collection-workspace', 'saved-items', 'search', 'source-list', 'unread-library'])
    expect(library.strip.map((item: any) => item.title)).toEqual([...library.strip.map((item: any) => item.title)].sort())
    expect(library.strip).toHaveLength(6)
  })

  it('lists the Capabilities of a Screen-less CLI as a terminal listing', () => {
    const cli = containerSketch(shop, 'operator-cli')
    expect(cli.frame).toMatchObject({ kind: 'terminal', strip: null, entry: 'prompt' })
    expect(cli.entry).toEqual(['fixture-shop admin'])
    expect(cli.wall).toBeNull()
    expect(cli.listing.map((item: any) => item.capabilityId)).toEqual(['manage-orders'])
    const webhook = containerSketch(shop, 'payment-webhook')
    expect(webhook.frame.kind).toBe('inbound')
    expect(webhook.listing.map((item: any) => item.capabilityId)).toEqual(['settle-payment'])
  })

  it('never draws a strip for a frame that has none', () => {
    for (const [type, frame] of Object.entries(SKETCH_FRAMES) as Array<[string, any]>) {
      if (['web', 'desktop-app', 'mobile-app'].includes(type)) expect(frame.strip).not.toBeNull()
      else expect(frame.strip).toBeNull()
    }
  })

  it('offers the Sketch tab after Overview, and a place\'s own Delivery, on Screens and on containers with something to draw', () => {
    const ids = (resource: any) => tabsFor(shop, resource).map((tab: any) => tab.id)
    expect(ids(shop.byKey.get('screen:customer-web::storefront::product-record')).slice(0, 3)).toEqual(['overview', 'delivery', 'sketch'])
    expect(ids(shop.byKey.get('interface:customer-web')).slice(0, 3)).toEqual(['overview', 'delivery', 'sketch'])
    expect(ids(shop.byKey.get('experience:customer-web::storefront')).slice(0, 3)).toEqual(['overview', 'delivery', 'sketch'])
    expect(ids(shop.byKey.get('interface:operator-cli'))).toContain('sketch')
    expect(ids(shop.byKey.get('entity:order'))).not.toContain('sketch')
    expect(hasContainerSketch({ screenIds: [], capabilityIds: [] })).toBe(false)
  })
})

describe('Storyboard', () => {
  const board = storyboard(shop, 'cancel-an-order-before-fulfilment', 'web-to-admin')

  it('draws one frame per Step on the route, a note for a condition, a transcript line for a Screen-less place', () => {
    expect(board.routeName).toBe('Web To Admin')
    expect(board.frames.map((frame: any) => frame.kind)).toEqual(['sketch', 'sketch', 'container', 'note', 'sketch'])
    expect(board.frames.map((frame: any) => frame.index)).toEqual([0, 1, 2, 3, 4])
    const [browse, place, settle, condition, cancel] = board.frames
    expect(browse.sketch.screenId).toBe('customer-web::storefront::product-record')
    expect(place.sketch.screenId).toBe('customer-web::storefront::product-record')
    expect(settle.container.containerId).toBe('payment-webhook')
    expect(settle.container.frame.kind).toBe('inbound')
    expect(settle).toMatchObject({ product: true, line: { prompt: false, text: 'The payment settles and the order is confirmed' } })
    expect(condition.text).toBe('Reconciliation shows the product cannot be fulfilled')
    expect(cancel.sketch.screenId).toBe('admin-web::order-detail')
  })

  it('lights the Capability of an actor Step, and the Entities a Product Step changes', () => {
    const [browse, place, , , cancel] = board.frames
    expect(browse.sketch.actions.map((action: any) => [action.capabilityId, action.lit])).toEqual([['browse-catalog', true], ['place-order', false]])
    expect(place.sketch.actions.map((action: any) => [action.capabilityId, action.lit])).toEqual([['browse-catalog', false], ['place-order', true]])
    expect(cancel.sketch.actions.map((action: any) => [action.capabilityId, action.lit])).toEqual([['cancel-order', true], ['manage-orders', false]])
    expect(cancel.product).toBe(false)
    expect(browse.capabilityTitle).toBe('Catalog browsing')
    expect(cancel.sketch.groups.every((group: any) => !group.lit)).toBe(true)

    const checkout = storyboard(shop, 'complete-checkout', 'web')
    const address = checkout.frames[1]
    expect(address.kind).toBe('sketch')
    expect(address.capabilityTitle).toBe('')
    expect(address.sketch.groups.find((group: any) => group.entityId === 'shopper').lines).toEqual([{ kind: 'field', label: 'Delivery address', lit: true }])
    const productStep = checkout.frames.find((frame: any) => frame.kind === 'sketch' && frame.product)
    expect(productStep).toBeTruthy()
  })

  it('draws a Step with a Context on another route only as an interstitial, and lights a Product Step by Entity', () => {
    const reorder = storyboard(reader, 'reorder-an-owned-collection', 'web')
    expect(reorder.frames.map((frame: any) => frame.kind)).toEqual(['sketch', 'sketch', 'sketch', 'sketch', 'note'])
    const moved = reorder.frames[3]
    expect(moved.product).toBe(true)
    const collection = moved.sketch.groups.find((group: any) => group.entityId === 'collection')
    expect(collection.lit).toBe(true)
    expect(collection.lines.every((line: any) => line.lit)).toBe(true)
    expect(moved.sketch.groups.find((group: any) => group.entityId === 'item').lit).toBe(false)
  })

  it('returns null for an unknown Scenario or route', () => {
    expect(storyboard(shop, 'cancel-an-order-before-fulfilment', 'nowhere')).toBeNull()
    expect(storyboard(shop, 'nowhere', 'web')).toBeNull()
  })

  it('states the two derivations', () => {
    expect(SKETCH_DERIVATION).toMatch(/^A Sketch is the same skeleton for every Screen/)
    expect(SKETCH_DERIVATION).toMatch(/It arranges nothing the model does not say\.$/)
    expect(STORYBOARD_DERIVATION).toBe("A Storyboard is one route of one Scenario: one frame per Step that names a place, that place's Sketch with the Step's facts and Capability lit.")
  })
})
