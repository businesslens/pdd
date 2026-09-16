#!/usr/bin/env node
/** Exercise report destinations and resource readings against a running built CLI. */
import { chromium, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
const origin = process.argv[2]
if (!origin) throw new Error('Pass a running CLI report URL.')
const report = await fetch(new URL('/_businesslens/report.json', origin)).then(response => response.json())
const browser = await chromium.launch()
const errors = []
const screenshots = process.env.BLR_NAV_SCREENSHOTS
if (screenshots) mkdirSync(screenshots, { recursive: true })
/* A collection's Graph is reached by the switch inside it; the three matrices
   compare collections and are rail rows of their own below Overview. */
const graphs = ['Domains', 'Interfaces', 'Entities']
const matrices = [['Compare delivery', 'delivery'], ['Rule attachments', 'rule-attachments'], ['What changes what', 'what-changes-what']]
const sectionOf = { Domains: 'domain', Interfaces: 'interface', Entities: 'entity' }
const resourceUrl = (kind, id, suffix = '') => `${origin}/?s=${kind}&e=${encodeURIComponent(`${kind}:${id}`)}${suffix}`
/* A tab is its label and, at most, a count: `Scenarios 3` is Scenarios, `Scenarios v2` is not. */
const tab = (page, name) => page.getByRole('tab', { name: new RegExp(`^${name}( \\d+)?$`) })
async function choose(page, name) {
  const close = page.getByRole('button', { name: 'Close resource', exact: true })
  if (new URL(page.url()).searchParams.has('e')) {
    await close.click()
    await expect(page.locator('[data-resource-panel]')).toHaveCount(0)
  }
  if (page.viewportSize().width < 1024) await page.getByRole('button', { name: 'Open report navigation', exact: true }).click()
  await page.locator('.blr-navitem:visible').filter({ hasText: new RegExp(`^${name}`) }).click()
}
const capture = async (page, name) => { if (screenshots) await page.screenshot({ path: join(screenshots, `${name}.png`) }) }
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(origin)
    await expect(page.locator('.blr-report-shell')).toBeVisible()
    for (const collection of graphs) {
      const section = sectionOf[collection]
      await choose(page, collection)
      /* The surface names itself once. A collection has no tabs: the same set
         is drawn as Rows or as Graph, and the switch sits beside the filters. */
      await expect(page.getByRole('heading', { level: 1 })).toContainText(collection)
      await expect(page.locator('.blr-surface-tab')).toHaveCount(0)
      const count = await page.getByRole('heading', { level: 1 }).locator('.blr-meta').textContent()
      await expect(page.getByRole('button', { name: 'Draw as rows', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await page.getByRole('button', { name: 'Draw as graph', exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`[?&]t=graph(?:&|$)`))
      await expect(page).toHaveURL(new RegExp(`[?&]s=${section}(?:&|$)`))
      await expect(page.getByRole('button', { name: 'Draw as graph', exact: true })).toHaveAttribute('aria-pressed', 'true')
      /* The set is the same set: its count does not change with the drawing. */
      await expect(page.getByRole('heading', { level: 1 }).locator('.blr-meta')).toHaveText(count)
      await page.reload()
      await expect(page.getByRole('button', { name: 'Draw as graph', exact: true })).toHaveAttribute('aria-pressed', 'true')
      if (['interface', 'entity'].includes(section)) {
        await expect(page.locator('[data-flow-ready=true]')).toBeVisible({ timeout: 15000 })
      }
      if (width >= 1024) await expect(page.locator('.blr-navitem[data-current=true]')).toContainText(collection)
      await capture(page, `${width}-${section}-graph`)
      await page.getByRole('button', { name: 'Draw as rows', exact: true }).click()
      await expect(page).not.toHaveURL(/[?&]t=/)
      await choose(page, 'Overview')
    }
    for (const [label, section] of matrices) {
      await choose(page, label)
      /* A matrix is a section of its own: the rail row names it, the heading
         repeats that name, and it has no tabs. */
      await expect(page).toHaveURL(new RegExp(`[?&]s=${section}(?:&|$)`))
      await expect(page).not.toHaveURL(/[?&]t=/)
      await expect(page.getByRole('heading', { level: 1 })).toContainText(label)
      await expect(page.locator('.blr-surface-tab')).toHaveCount(0)
      await page.reload()
      await expect(page.getByRole('heading', { level: 1 })).toContainText(label)
      if (width >= 1024) await expect(page.locator('.blr-navitem[data-current=true]')).toContainText(label)
      await capture(page, `${width}-${section}`)
      const link = page.locator('.blr-topology-matrix [data-resource-key]').first()
      if (await link.count()) {
        const matrixUrl = page.url()
        await link.click()
        await expect(page).toHaveURL(/[?&]e=/)
        await page.goBack()
        await expect(page).toHaveURL(matrixUrl)
        await expect(page.getByRole('heading', { level: 1 })).toContainText(label)
      }
    }
    /* Branch rows only toggle. Each resource root contains an Overview link,
       including roots with no modeled children. */
    for (const [collection, kind, resources] of [
      ['Domains', 'domain', report.model.domains],
      ['Interfaces', 'interface', report.model.interfaces]
    ]) {
      await choose(page, collection)
      await expect(page.locator('[data-tree-card] [data-group-header]')).toHaveCount(0)
      const roots = page.locator('[data-tree-card] [role="treeitem"][aria-level="1"][aria-expanded]')
      await page.getByRole('button', { name: 'Collapse all', exact: true }).click()
      for (const root of await roots.all()) await expect(root).toHaveAttribute('aria-expanded', 'false')
      await page.getByRole('button', { name: 'Expand all', exact: true }).click()
      for (const root of await roots.all()) await expect(root).toHaveAttribute('aria-expanded', 'true')
      for (const resource of resources) {
        const title = kind === 'domain' ? resource.name : resource.title
        const card = page.locator(`[data-card-key="${kind}:${resource.id}"]`)
        const subject = card.getByRole('treeitem').first()
        const toggle = subject.getByRole('button')
        await expect(subject.getByText(title, { exact: true })).toBeVisible()
        const folders = card.locator('[role="treeitem"][aria-level="2"][aria-expanded]')
        const folderStates = () => folders.evaluateAll(items => items.map(item => item.getAttribute('aria-expanded')))
        const before = await folderStates()
        /* Every displayed folder has items and toggles on its label. */
        for (const folder of await folders.all()) {
          await expect(folder).toHaveAttribute('aria-expanded', 'true')
          await folder.locator('[data-slot="linkLabel"]').click()
          await expect(folder).toHaveAttribute('aria-expanded', 'false')
          await expect(page).not.toHaveURL(/[?&]e=/)
          await folder.press('Enter')
          await expect(folder).toHaveAttribute('aria-expanded', 'true')
        }
        await subject.getByText(title, { exact: true }).click()
        await expect(subject).toHaveAttribute('aria-expanded', 'false')
        await expect(card.getByRole('treeitem')).toHaveCount(1)
        await expect(page).not.toHaveURL(/[?&]e=/)
        await page.reload()
        await expect(subject).toHaveAttribute('aria-expanded', 'false')
        await subject.press('Enter')
        await expect(subject).toHaveAttribute('aria-expanded', 'true')
        await expect.poll(folderStates).toEqual(before)
        await subject.press('Space')
        await expect(subject).toHaveAttribute('aria-expanded', 'false')
        await toggle.press('Space')
        await expect(subject).toHaveAttribute('aria-expanded', 'true')
        await toggle.click()
        await expect(subject).toHaveAttribute('aria-expanded', 'false')
        await toggle.click()
        await expect(subject).toHaveAttribute('aria-expanded', 'true')
        await subject.press('ArrowLeft')
        await expect(subject).toHaveAttribute('aria-expanded', 'false')
        await subject.press('ArrowRight')
        await expect(subject).toHaveAttribute('aria-expanded', 'true')
        const overview = card.locator('[role="treeitem"][aria-level="2"]').filter({ has: page.getByText('Overview', { exact: true }) })
        await expect(overview).toHaveCount(1)
        await expect(overview.locator('.iconify')).toHaveCount(0)
        if (!before.length) await expect(card.getByRole('treeitem')).toHaveCount(2)
        await overview.click()
        await expect.poll(() => new URL(page.url()).searchParams.get('e')).toBe(`${kind}:${resource.id}`)
        await expect(page.locator('[data-resource-heading]')).toContainText(title)
        await page.reload()
        await expect(page.locator('[data-resource-heading]')).toContainText(title)
        await page.goBack()
        await expect(subject).toHaveAttribute('aria-expanded', 'true')
        await expect.poll(folderStates).toEqual(before)
      }
      const unassigned = page.locator('[data-card-key="unassigned"] [role="treeitem"]').first()
      if (await unassigned.count()) {
        await unassigned.getByText('Unassigned', { exact: true }).click()
        await expect(unassigned).toHaveAttribute('aria-expanded', 'false')
        await expect(page).not.toHaveURL(/[?&]e=/)
        await unassigned.getByText('Unassigned', { exact: true }).click()
        await expect(unassigned).toHaveAttribute('aria-expanded', 'true')
      }
      await capture(page, `${width}-${kind}-tree-links`)
    }
    await choose(page, 'Interfaces')
    await expect(page.locator('[data-interface-directory]')).toHaveCount(0)
    /* Interfaces and Domains read as one tree card per subject. */
    await expect(page.locator('[data-tree-card]')).toHaveCount(report.model.interfaces.length)
    const experience = report.model.experiences.find(item => report.model.screens.some(screen => screen.id.startsWith(`${item.id}::`)))
    if (experience) {
      const item = page.getByRole('treeitem').filter({ has: page.getByText(experience.title, { exact: true }) }).first()
      const toggle = item.getByRole('button')
      await expect(item).toHaveAttribute('aria-expanded', 'true')
      await toggle.click()
      await expect(item).toHaveAttribute('aria-expanded', 'false')
      await expect(page).not.toHaveURL(/[?&]e=/)
      await page.reload()
      await expect(item).toHaveAttribute('aria-expanded', 'false')
      await toggle.press('Space')
      await expect(item).toHaveAttribute('aria-expanded', 'true')
      await item.press('ArrowLeft')
      await expect(item).toHaveAttribute('aria-expanded', 'false')
      await item.press('ArrowRight')
      await expect(item).toHaveAttribute('aria-expanded', 'true')
      await item.getByText(experience.title, { exact: true }).click()
      await expect(item).toHaveAttribute('aria-expanded', 'false')
      await expect(page).not.toHaveURL(/[?&]e=/)
      await item.press('Enter')
      await expect(item).toHaveAttribute('aria-expanded', 'true')
      const overview = item.locator('..').getByRole('treeitem').filter({ has: page.getByText('Overview', { exact: true }) }).first()
      await expect(overview.locator('.iconify')).toHaveCount(0)
      await overview.click()
      await expect(page).toHaveURL(/[?&]e=experience/)
      await page.goBack()
      await expect(item).toHaveAttribute('aria-expanded', 'true')
    }
    const screens = report.model.screens
    if (screens.length) {
      const screen = screens.find(item => item.id.split('::').length === 2) ?? screens[0]
      await page.goto(`${origin}/?s=interface&e=${encodeURIComponent(`screen:${screen.id}`)}`)
      /* The page names itself; the trail stops at its parent. */
      await expect(page.locator('[data-resource-heading]')).toContainText(screen.title)
      await expect(page.locator('[data-resource-panel]')).toContainText('Screen')
      await capture(page, `${width}-screen-page`)
      /* One tab switches nothing, so no strip renders — and the ways out stay. */
      await expect(page.locator('.blr-surface-tab')).toHaveCount(0)
      await page.getByRole('button', { name: 'Interface map', exact: true }).click()
      await expect(page).toHaveURL(/s=interface.*t=graph/)
    }
    await choose(page, 'Capabilities')
    const groups = page.locator('[data-group-header]')
    if (await groups.count()) {
      await groups.first().click()
      await expect(groups.first()).toHaveAttribute('aria-expanded', 'false')
      await page.reload()
      await expect(groups.first()).toHaveAttribute('aria-expanded', 'false')
      const card = page.locator('.blr-resource-row:visible').first()
      if (await card.count()) {
        await card.click()
        await expect(page).toHaveURL(/e=capability/)
        await page.goBack()
        await expect(groups.first()).toHaveAttribute('aria-expanded', 'false')
      }
      await groups.first().click()
    }
    /* Grouping is authored, so nothing offers to change it. */
    await expect(page.getByRole('combobox', { name: /^Group / })).toHaveCount(0)
    await expect(page.getByRole('tab', { name: 'Table', exact: true })).toHaveCount(0)
    /* An address naming a view this report has no home for lands on Overview,
       which names itself with the Product's own title rather than guessing. */
    await page.goto(`${origin}/?s=topology&tv=sitemap`)
    await expect(page.locator('.blr-report-shell')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Overview')
    await expect(tab(page, 'About').first()).toHaveAttribute('aria-selected', 'true')
    /* The way home is chrome: it is on every surface, this one included. */
    await expect(page.locator('.blr-report-header')).toContainText(report.title)
    /* The Product's page is a page: its readings are peer tabs, not disclosures. */
    await expect(page.locator('.blr-disclosure')).toHaveCount(0)
    /* About is the default reading and carries the Product's own name, so it
       needs no tab parameter and nothing else repeats the identity. */
    await expect(page.getByRole('heading', { level: 2 }).first()).toContainText(report.title)
    for (const [label, mode] of [['Coverage', 'coverage'], ['References', 'references']]) {
      await tab(page, label).first().click()
      await expect(page).toHaveURL(new RegExp(`[?&]t=${mode}(?:&|$)`))
      await page.reload()
      await expect(tab(page, label).first()).toHaveAttribute('aria-selected', 'true')
      await capture(page, `${width}-product-${mode}`)
    }
    await tab(page, 'About').first().click()
    await expect(page).not.toHaveURL(/[?&]t=/)

    const journey = report.model.journeys[0]
    if (journey) {
      await page.goto(resourceUrl('journey', journey.id))
      await tab(page, 'Scenarios').click()
      await expect(page).toHaveURL(/rt=scenarios/)
      /* Comparing Journeys is the collection's job, not a third tab here. */
      await expect(page.getByRole('button', { name: 'Composition', exact: true })).toHaveCount(0)
    }
    for (const kind of ['capability', 'journey']) {
      const parents = report.model[kind === 'capability' ? 'capabilities' : 'journeys']
      const parent = parents.find(item => report.model[`${kind}Scenarios`].some(scenario => scenario[`${kind}Id`] === item.id))
      if (!parent) continue
      const scenario = report.model[`${kind}Scenarios`].find(item => item[`${kind}Id`] === parent.id)
      await page.goto(resourceUrl(kind, parent.id, '&rt=scenarios'))
      const card = page.locator(`[data-row-key="${kind}-scenario:${scenario.id}"] [data-scenario-card]`)
      const toggle = card.locator('.blr-summary-toggle')
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      const link = card.locator('a[data-resource-key]').first()
      if (await link.count()) {
        await link.click()
        await expect(page).not.toHaveURL(/rt=scenarios/)
      } else {
        await choose(page, 'Entities')
        await expect(page).toHaveURL(/[?&]s=entity(?:&|$)/)
      }
      await page.goBack()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      await page.reload()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      await tab(page, 'Overview').click()
      await expect(page).not.toHaveURL(/[?&]t=/)
      await tab(page, 'Scenarios').click()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      await page.locator('[data-resource-panel]').getByRole('button', { name: 'Collapse all', exact: true }).click()
      await page.reload()
      await expect(page.locator('.blr-summary-toggle[aria-expanded=true]')).toHaveCount(0)
      await page.goto(resourceUrl(kind, scenario.id).replace(`e=${kind}%3A`, `e=${kind}-scenario%3A`))
      await expect(page.locator('.blr-summary-toggle[aria-expanded=true]')).toHaveCount(1)
    }
    const capability = report.model.capabilities[0]
    if (capability && journey) {
      await page.goto(resourceUrl('capability', capability.id))
      await page.getByRole('button', { name: 'Capability reach', exact: true }).click()
      await expect(page).toHaveURL(/[?&]tf=capability/)
      const focusedUrl = page.url()
      await choose(page, 'Journeys')
      await expect(page).toHaveURL(/[?&]s=journey(?:&|$)/)
      await expect(page).not.toHaveURL(/[?&]tf=/)
      await page.getByRole('button', { name: 'Draw as graph', exact: true }).click()
      await expect(page).toHaveURL(/[?&]t=graph(?:&|$)/)
      await expect(page).not.toHaveURL(/[?&]tf=/)
      await page.goBack()
      await expect(page).not.toHaveURL(/[?&]t=/)
      await page.goBack()
      await expect(page).toHaveURL(focusedUrl)
    }
    const iface = report.model.interfaces.find(item => report.model.experiences.some(experience => experience.id.startsWith(`${item.id}::`))) ?? report.model.interfaces[0]
    if (iface) {
      await page.goto(resourceUrl('interface', iface.id))
      await expect(page.locator('[data-interface-delivery]')).toBeVisible()
      await expect(page.locator('[data-resource-connections]')).toHaveCount(0)
      const toggle = page.locator('[data-interface-delivery] button[aria-expanded]').first()
      if (await toggle.count()) {
        const old = await toggle.getAttribute('aria-expanded')
        await toggle.click()
        await expect(toggle).toHaveAttribute('aria-expanded', old === 'true' ? 'false' : 'true')
        // Resource expansion is remembered separately from the working graph.
        await page.reload()
        await expect(toggle).toHaveAttribute('aria-expanded', old === 'true' ? 'false' : 'true')
      }
      await capture(page, `${width}-interface-delivery`)
      await page.getByRole('button', { name: 'Interface map', exact: true }).click()
      await expect(page).toHaveURL(/s=interface.*t=graph.*tf=interface/)
      await expect(page.locator('[data-flow-ready=true]')).toBeVisible()
      await page.goBack()
      await expect(page.locator('[data-interface-delivery]')).toBeVisible()
    }
    const entity = report.model.entities.find(item => item.relations.length) ?? report.model.entities[0]
    if (entity) {
      await page.goto(resourceUrl('entity', entity.id))
      await expect(page.locator('[data-resource-connections]')).toHaveCount(0)
      await tab(page, 'Connections').click()
      await expect(page.locator('[data-resource-connections]')).toBeVisible()
      await capture(page, `${width}-entity-connections`)
      await page.getByRole('button', { name: 'Entity relationships', exact: true }).click()
      await expect(page).toHaveURL(/s=entity.*t=graph.*tf=entity/)
      await expect(page.locator('[data-flow-ready=true]')).toBeVisible()
    }
    /* Every named view belongs to a resource collection; the Overview owns none. */
    await page.goto(origin)
    await expect(tab(page, 'All resources and connections')).toHaveCount(0)
    if (width >= 1024) await expect(page.locator('.blr-navitem[data-current=true]')).toHaveText('Overview')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await context.close()
    console.log(`Passed ${width}px: Rows/Graph, matrix Back, collection focus, Scenario persistence, tree toggles, reload, exits and Interface delivery.`)
  }
  expect(errors).toEqual([])
} finally { await browser.close() }
