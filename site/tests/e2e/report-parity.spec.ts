import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { expectReportHydrated } from '../support/report'

/**
 * The site renders each Blueprint from the report generated beside it, and
 * `pdd-kit view` renders a Product Model on localhost. Pull the generated
 * report into a scratch repository the way a reader would, serve it with the
 * CLI, and require both to read the same.
 */
const slug = 'kanban-board'
const cli = resolve('node_modules/pdd-toolkit/dist/cli.js')

test('the site and the local viewer render one Product Report contract', async ({ page, request }) => {
  test.setTimeout(120_000)
  const directory = mkdtempSync(join(tmpdir(), 'pdd-kit-report-parity-'))
  let viewer: ChildProcessWithoutNullStreams | undefined

  try {
    const landingReport = await request.get(`/_blueprints/${slug}.json`)
    const landingLogo = await request.get(`/_blueprints/${slug}.logo.svg`)
    expect(landingReport.status()).toBe(200)
    expect(landingLogo.status()).toBe(200)
    expect(landingReport.headers()['content-type']).toContain('application/json')
    const reportFile = join(directory, 'report.json')
    writeFileSync(reportFile, await landingReport.body())
    execFileSync(process.execPath, [cli, '--cwd', directory, 'blueprint', 'open', reportFile])
    const productDirectory = join(directory, 'product-model', 'product')
    mkdirSync(productDirectory)
    renameSync(
      join(directory, 'product-model', 'product.md'),
      join(productDirectory, 'product.md')
    )
    writeFileSync(join(productDirectory, 'logo.svg'), await landingLogo.body())

    const port = await availablePort()
    const ossURL = `http://127.0.0.1:${port}`
    viewer = spawn(process.execPath, [
      cli,
      '--cwd', directory,
      'view',
      '--no-open',
      '--port', String(port)
    ])
    await waitForViewer(ossURL, viewer)

    const ossPage = await page.context().newPage()
    await Promise.all([
      page.goto(`/blueprints/${slug}`),
      ossPage.goto(ossURL)
    ])

    await expect(page.locator('html')).toHaveClass(/light/)
    await expect(ossPage.locator('html')).toHaveClass(/light/)
    await expectReportHydrated(page)
    await expect(ossPage.locator('[data-pdd-kit-report-viewer]')).toBeVisible()
    await expect(page.locator(`img.size-12[src="/_blueprints/${slug}.logo.svg"]`)).toBeVisible()
    await expect(ossPage.locator('img.size-12[src^="/_pdd-kit/logo.svg"]')).toBeVisible()

    for (const section of ['Entities', 'Journeys', 'Business Rules']) {
      await page.getByRole('button', { name: section, exact: true }).click()
      await ossPage.getByRole('button', { name: section, exact: true }).click()
      await expect.poll(async () => reportContract(page)).toEqual(await reportContract(ossPage))
    }

    const report = await landingReport.json()
    const hosts = [[page, `/blueprints/${slug}`, 'tab'], [ossPage, ossURL, 's']] as const
    const rail = (target: Page, name: string) => target.locator('.report-navitem').filter({ hasText: name })
    // A collection's view is chosen from preview cards behind one trigger; the
    // chooser records the current drawing on itself.
    const drawGraph = async (target: Page) => {
      await target.locator('[data-view-trigger]').click()
      await target.getByRole('button', { name: 'Draw as graph', exact: true }).click()
    }
    const drawing = (target: Page) => target.locator('[data-drawing-switch]')
    for (const [section, collection] of [['domain', 'Domains'], ['interface', 'Interfaces'], ['entity', 'Entities'], ['rule', 'Business Rules'], ['capability', 'Capabilities'], ['journey', 'Journeys']] as const) {
      for (const [target, , sectionKey] of hosts) {
        await rail(target, collection).click()
        /* The heading names the surface; the switch changes only how its set is drawn. */
        await expect(target.getByRole('heading', { level: 1 })).toContainText(collection)
        await drawGraph(target)
        await expect(target).toHaveURL(/[?&]t=graph/)
        await expect(target).toHaveURL(new RegExp(`[?&]${sectionKey}=${section}`))
        await expect(drawing(target)).toHaveAttribute('data-current-drawing', 'graph')
        await expect(target.locator('[data-flow-ready=true]')).toBeVisible({ timeout: 15_000 })
      }
      await expect.poll(async () => page.locator('.report-product-topology').innerText())
        .toEqual(await ossPage.locator('.report-product-topology').innerText())
      await page.reload()
      await expect(drawing(page)).toHaveAttribute('data-current-drawing', 'graph')
    }
    for (const [target, base, sectionKey] of hosts) {
      // An address naming no destination lands on the Overview rather than
      // guessing, and the Product identity stays visible in the sidebar.
      await target.goto(`${base}?${sectionKey}=topology&tv=sitemap`)
      await expect(target.getByRole('heading', { level: 1 })).toContainText('Overview')
      await expect(target.locator('[data-report-product-picker]:visible')).toContainText(report.title)
      // The three cross-collection comparisons are each the Matrix drawing of
      // the collection that supplies their subjects, chosen like any other view.
      for (const [collection, section] of [['Capabilities', 'capability'], ['Entities', 'entity'], ['Business Rules', 'rule']] as const) {
        await rail(target, collection).click()
        await target.locator('[data-view-trigger]').click()
        await target.getByRole('button', { name: 'Draw as matrix', exact: true }).click()
        await expect(target).toHaveURL(new RegExp(`[?&]${sectionKey}=${section}`))
        await expect(target).toHaveURL(/[?&]t=matrix/)
        await expect(drawing(target)).toHaveAttribute('data-current-drawing', 'matrix')
      }
    }
    await expect.poll(async () => reportContract(page)).toEqual(await reportContract(ossPage))
    const journey = report.model.journeys[0]
    if (journey) {
      for (const [target, base, sectionKey] of hosts) {
        // A Journey opens in a slideover over its collection; its Scenarios are
        // a tab of that reading with an address of its own, and Close returns
        // to the working view underneath.
        await target.goto(`${base}?${sectionKey}=journey&e=${encodeURIComponent(`journey:${journey.id}`)}&rt=scenarios`)
        const panel = target.locator('[data-resource-panel]')
        await expect(panel.locator('[data-resource-heading]')).toContainText(journey.title)
        await expect(panel.getByRole('tab', { name: /^Scenarios/ })).toHaveAttribute('aria-selected', 'true')
        await panel.getByRole('button', { name: 'Close resource' }).click()
        await expect(target).not.toHaveURL(/[?&]e=/)
        await expect(target.getByRole('heading', { level: 1 })).toContainText('Journeys')
      }
      await expect.poll(async () => reportContract(page)).toEqual(await reportContract(ossPage))
    }
    const entity = report.model.entities.find((item: { states: unknown[] }) => item.states.length)
    if (entity) {
      for (const [target, base, sectionKey] of hosts) {
        // The composed machine has actually drawn, not merely reserved a box:
        // `report-diagram-plane` has not existed since the diagram engine was
        // rewritten, and an absent element is trivially not visible.
        await target.goto(`${base}?${sectionKey}=entity&e=${encodeURIComponent(`entity:${entity.id}`)}&rt=lifecycle`)
        await expect(target.locator('[data-flow-ready=true]')).toBeVisible({ timeout: 15_000 })
        await target.reload()
        await expect(target.locator('[data-flow-ready=true]')).toBeVisible({ timeout: 15_000 })
      }
      await expect.poll(async () => reportContract(page)).toEqual(await reportContract(ossPage))
    }
    for (const target of [page, ossPage]) {
      const accessibility = await new AxeBuilder({ page: target }).include('[data-pdd-kit-report-viewer]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(accessibility.violations).toEqual([])
    }

    // The local viewer serves the logo it was given, sandboxed. The site's copy
    // is a static file whose headers belong to the host.
    const ossLogo = await fetch(`${ossURL}/_pdd-kit/logo.svg`)
    expect(ossLogo.status).toBe(200)
    expect(ossLogo.headers.get('content-security-policy')).toContain('script-src \'none\'')
    expect(Buffer.from(await landingLogo.body())).toEqual(Buffer.from(await ossLogo.arrayBuffer()))

    await ossPage.close()
  } finally {
    await stopViewer(viewer)
    rmSync(directory, { recursive: true, force: true })
  }
})

async function reportContract(page: Page) {
  return page.locator('[data-pdd-kit-report-viewer]').evaluate((root) => {
    const normalize = (value: string | null | undefined) => value?.replace(/\s+/g, ' ').trim() ?? ''
    const center = root.querySelector('section.flex.min-w-0.flex-1.flex-col')
    // The status slot is the host's own: the catalog shows when the report was
    // generated, while the local viewer shows its problems chip and live
    // connection instead. Every other reading must match. Read the slot the way
    // the content is read: its items have no whitespace between them, so
    // `textContent` would run "1 warning" into "Live" and never match.
    const status = center?.querySelector<HTMLElement>('[data-report-status]')
    const content = normalize((center as HTMLElement | null)?.innerText)
    const statusText = normalize(status?.innerText)
    return {
      navigation: Array.from(root.querySelectorAll('.report-navitem'))
        .map(element => normalize(element.textContent)),
      content: statusText ? content.replace(statusText, '[report status]') : content
    }
  })
}

async function availablePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolveListen, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolveListen)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Could not reserve a viewer port.')
  await new Promise<void>((resolveClose, reject) => {
    server.close(error => error ? reject(error) : resolveClose())
  })
  return address.port
}

async function waitForViewer(url: string, process: ChildProcessWithoutNullStreams): Promise<void> {
  let output = ''
  process.stdout.on('data', (chunk) => { output += chunk.toString() })
  process.stderr.on('data', (chunk) => { output += chunk.toString() })
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    if (process.exitCode !== null) throw new Error(`OSS viewer exited early.\n${output}`)
    try {
      const response = await fetch(`${url}/_pdd-kit/report.json`)
      if (response.ok) return
    } catch {
      // The local listener is still starting.
    }
    await delay(100)
  }
  throw new Error(`OSS viewer did not become ready.\n${output}`)
}

async function stopViewer(process: ChildProcessWithoutNullStreams | undefined): Promise<void> {
  if (!process || process.exitCode !== null) return
  process.kill('SIGTERM')
  await Promise.race([
    new Promise<void>(resolveExit => process.once('exit', () => resolveExit())),
    delay(2_000).then(() => { process.kill('SIGKILL') })
  ])
}
