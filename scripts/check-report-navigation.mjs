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
/* Every named view is a tab of one collection, reached from inside it. */
const entries = [
  ['domain', 'Domains', 'Map', 'map'],
  ['interface', 'Interfaces', 'Map', 'map'],
  ['interface', 'Interfaces', 'Compare delivery', 'delivery'],
  ['entity', 'Entities', 'Relationships', 'relationships'],
  ['rule', 'Business Rules', 'Attachments', 'attachments'],
  ['capability', 'Capabilities', 'What changes what', 'mutations'],
  ['journey', 'Journeys', 'Composition', 'composition']
]
const resourceUrl = (kind, id, suffix = '') => `${origin}/?s=${kind}&e=${encodeURIComponent(`${kind}:${id}`)}${suffix}`
const tab = (page, name) => page.locator('.blr-surface-tab').filter({ hasText: new RegExp(`^${name}`) })
async function choose(page, name) {
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
    for (const [section, collection, label, mode] of entries) {
      await choose(page, collection)
      /* The surface names itself once; the tab names the reading beside List. */
      await expect(page.getByRole('heading', { level: 1 })).toContainText(collection)
      await expect(tab(page, 'List')).toHaveAttribute('aria-selected', 'true')
      await tab(page, label).first().click()
      await expect(page).toHaveURL(new RegExp(`[?&]t=${mode}(?:&|$)`))
      await expect(page).toHaveURL(new RegExp(`[?&]s=${section}(?:&|$)`))
      await expect(tab(page, label).first()).toHaveAttribute('aria-selected', 'true')
      /* A view states its question once, and never titles itself. */
      await expect(page.getByRole('heading', { name: label, exact: true })).toHaveCount(0)
      await page.reload()
      await expect(tab(page, label).first()).toHaveAttribute('aria-selected', 'true')
      if (['interface', 'entity'].includes(section) && mode !== 'delivery') {
        await expect(page.locator('[data-flow-ready=true]')).toBeVisible({ timeout: 15000 })
      }
      if (width >= 1024) await expect(page.locator('.blr-navitem[data-current=true]')).toContainText(collection)
      await capture(page, `${width}-${section}-${mode}`)
      await choose(page, 'Overview')
    }
    /* Interfaces read as rows like every other collection: the row says what it
       contains, and the tree is what the Map tab is for. */
    await choose(page, 'Interfaces')
    await expect(page.locator('[data-interface-directory]')).toHaveCount(0)
    await expect(page.locator('.blr-resource-row')).toHaveCount(report.model.interfaces.length)
    const screens = report.model.screens
    if (screens.length) {
      const screen = screens.find(item => item.id.split('::').length === 2) ?? screens[0]
      await page.goto(`${origin}/?s=interface&e=${encodeURIComponent(`screen:${screen.id}`)}`)
      /* The page names itself; the trail stops at its parent. */
      await expect(page.getByRole('heading', { level: 1 })).toContainText(screen.title)
      const trail = page.locator('[data-page-trail]')
      await expect(trail).toContainText('Interfaces')
      await expect(trail).not.toContainText(screen.title)
      await capture(page, `${width}-screen-page`)
      /* One tab switches nothing, so no strip renders — and the ways out stay. */
      await expect(page.locator('.blr-surface-tab')).toHaveCount(0)
      await page.getByRole('button', { name: 'Interface map', exact: true }).click()
      await expect(page).toHaveURL(/s=interface.*t=map/)
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
    await expect(tab(page, 'Overview').first()).toHaveAttribute('aria-selected', 'true')
    /* The way home is chrome: it is on every surface, this one included. */
    await expect(page.locator('.blr-report-header')).toContainText(report.title)
    /* The Product's page is a page: its readings are peer tabs, not disclosures. */
    await expect(page.locator('.blr-disclosure')).toHaveCount(0)
    for (const [label, mode] of [['About', 'about'], ['Coverage', 'coverage'], ['Model counts', 'counts'], ['References', 'references']]) {
      await tab(page, label).first().click()
      await expect(page).toHaveURL(new RegExp(`[?&]t=${mode}(?:&|$)`))
      await page.reload()
      await expect(tab(page, label).first()).toHaveAttribute('aria-selected', 'true')
      await capture(page, `${width}-product-${mode}`)
    }
    await tab(page, 'Overview').first().click()
    await expect(page).not.toHaveURL(/[?&]t=/)

    const journey = report.model.journeys[0]
    if (journey) {
      await page.goto(resourceUrl('journey', journey.id))
      await tab(page, 'Scenarios').click()
      await expect(page).toHaveURL(/t=scenarios/)
      /* Comparing Journeys is the collection's job, not a third tab here. */
      await expect(page.getByRole('button', { name: 'Composition', exact: true })).toHaveCount(0)
      const scenario = report.model.journeyScenarios.find(item => item.journeyId === journey.id)
      await page.goto(`${origin}/?s=journey&t=composition&ts=${scenario.id}`)
      await expect(page.locator(`[data-scenario-id="${scenario.id}"]`)).toBeVisible()
      await capture(page, `${width}-journey-composition`)
      await page.locator('.blr-composition-step .blr-topology-link').first().click()
      await expect(page).toHaveURL(/e=capability/)
      await page.goBack()
      await expect(tab(page, 'Composition').first()).toHaveAttribute('aria-selected', 'true')
    }
    const iface = report.model.interfaces.find(item => report.model.experiences.some(experience => experience.interfaceId === item.id)) ?? report.model.interfaces[0]
    if (iface) {
      await page.goto(resourceUrl('interface', iface.id))
      await expect(page.locator('[data-interface-delivery]')).toBeVisible()
      await expect(page.locator('[data-resource-connections]').getByText('Screens available', { exact: true })).toHaveCount(0)
      const toggle = page.locator('[data-interface-delivery] button[aria-expanded]').first()
      if (await toggle.count()) {
        const old = await toggle.getAttribute('aria-expanded')
        await toggle.click()
        await expect(toggle).toHaveAttribute('aria-expanded', old === 'true' ? 'false' : 'true')
        await expect(page).toHaveURL(new RegExp(`[?&]${old === 'true' ? 'tc' : 'tx'}=`))
        await page.reload()
        await expect(toggle).toHaveAttribute('aria-expanded', old === 'true' ? 'false' : 'true')
      }
      await capture(page, `${width}-interface-delivery`)
      await page.getByRole('button', { name: 'Interface map', exact: true }).click()
      await expect(page).toHaveURL(/s=interface.*t=map.*tf=interface/)
      await expect(page.locator('[data-flow-ready=true]')).toBeVisible()
      await page.goBack()
      await expect(page.locator('[data-interface-delivery]')).toBeVisible()
    }
    const entity = report.model.entities.find(item => item.relations.length) ?? report.model.entities[0]
    if (entity) {
      await page.goto(resourceUrl('entity', entity.id))
      await expect(page.locator('[data-resource-connections]')).toBeVisible()
      await capture(page, `${width}-entity-connections`)
      await page.getByRole('button', { name: 'Entity relationships', exact: true }).click()
      await expect(page).toHaveURL(/s=entity.*t=relationships.*tf=entity/)
      await expect(page.locator('[data-flow-ready=true]')).toBeVisible()
    }
    /* Every named view belongs to a resource collection; the Overview owns none. */
    await page.goto(origin)
    await expect(tab(page, 'All resources and connections')).toHaveCount(0)
    if (width >= 1024) await expect(page.locator('.blr-navitem[data-current=true]')).toHaveText('Overview')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await context.close()
    console.log(`Passed ${width}px: tabs as the only switch, self-naming surfaces, Back, reload, exits, Journey composition and Interface delivery.`)
  }
  expect(errors).toEqual([])
} finally { await browser.close() }
