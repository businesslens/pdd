#!/usr/bin/env node
/** Exercise real repository previews in the built viewer, without changing the golden fixture. */
import { chromium, expect } from '@playwright/test'
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const project = mkdtempSync(join(tmpdir(), 'blr-prose-browser-'))
cpSync(join(repository, 'test/fixtures/fixture-shop'), project, { recursive: true, filter: path => !/\.businesslens\/(build|cache)(\/|$)/.test(path) })
mkdirSync(join(project, 'docs'), { recursive: true })
const markdown = '---\ntitle: Guide\nunsafe: <script>metadata</script>\n---\n# Reference guide\n\nA **formatted document** with [next steps](./next.md#next-steps), an [external link](https://example.com/guide), and a [later section](#later-section).\n\n| Resource | Meaning |\n|---|---|\n| Order | A confirmed purchase |\n\n```typescript [example.ts]\n// A comment\nconst message = "hello"\nexport function greet() { return message }\n```\n\n<script>window.previewExecuted = true</script>\n\n::u-button{onClick="window.previewExecuted = true"}\n\n![Local image](./diagram.svg)\n\n' + Array.from({ length: 24 }, (_, index) => 'Paragraph ' + index + '. The reader keeps your place while following related documents.\n\n').join('') + '## Later section\n\n[Continue](./next.md#next-steps)\n'
writeFileSync(join(project, 'docs/guide.md'), markdown)
writeFileSync(join(project, 'docs/next.md'), '# Next steps\n\n[Return](./guide.md)\n')
writeFileSync(join(project, 'docs/diagram.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80"><rect width="240" height="80" fill="#a8b8a0"/></svg>')
const order = join(project, '.businesslens/entities/order.md')
writeFileSync(order, readFileSync(order, 'utf8').replace('---\n', '---\nreferences:\n  - kind: doc\n    role: context\n    target: docs/guide.md\n    title: Reference guide\n'))
for (const args of [['init', '--quiet'], ['add', '.'], ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '--quiet', '-m', 'fixture']]) {
  const result = spawnSync('git', args, { cwd: project, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr)
}
const viewer = spawn(process.execPath, [join(repository, 'dist/cli.js'), 'view', '--no-open'], { cwd: project, stdio: ['ignore', 'pipe', 'pipe'] })
let log = ''
viewer.stdout.on('data', data => { log += data })
viewer.stderr.on('data', data => { log += data })
const browser = await chromium.launch()
const screenshots = process.env.BLR_NAV_SCREENSHOTS
if (screenshots) mkdirSync(screenshots, { recursive: true })
const errors = []
try {
  let origin
  for (let attempt = 0; attempt < 100; attempt++) {
    origin = /Viewing the local Product Model at (http:\/\/127\.0\.0\.1:\d+)/.exec(log)?.[1]
    if (origin) break
    if (viewer.exitCode !== null) throw new Error(log)
    await delay(100)
  }
  if (!origin) throw new Error(log)
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    const panel = page.locator('[data-resource-panel]')
    const reading = panel.locator('[data-reference-scroller]')
    await page.goto(origin + '/?s=entity&e=entity:order&rt=references')
    await panel.getByRole('link', { name: /^docs\/guide.md/ }).click()
    await expect(reading.getByRole('heading', { name: 'Reference guide', exact: true })).toBeVisible()
    await expect(panel.locator('iframe')).toHaveCount(0)
    await expect(reading.locator('strong')).toHaveText('formatted document')
    await expect(reading.locator('table')).toBeVisible()
    await expect(reading.locator('img')).toBeVisible()
    await expect(reading.locator('img')).toHaveJSProperty('naturalWidth', 240)
    await expect(reading.locator('script, u-button')).toHaveCount(0)
    expect(await page.evaluate(() => window.previewExecuted)).toBeUndefined()
    await expect(reading).toContainText('::u-button')
    await expect(reading.locator('[data-document-metadata]')).not.toHaveAttribute('open', '')
    const colors = () => reading.locator('.shiki span[style]').evaluateAll(tokens => [...new Set(tokens.map(token => getComputedStyle(token).color))])
    const light = await colors()
    expect(light.length).toBeGreaterThan(2)
    const lineHeights = await reading.locator('.shiki .line').evaluateAll(lines => lines.map(line => line.getBoundingClientRect().height))
    expect(Math.max(...lineHeights)).toBeLessThan(35)
    await reading.getByRole('button', { name: 'Copy code to clipboard' }).click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('// A comment\nconst message = "hello"\nexport function greet() { return message }')
    await reading.getByText('Document metadata', { exact: true }).click()
    if (screenshots) await page.screenshot({ path: join(screenshots, width + '-markdown.png'), animations: 'disabled' })
    await page.evaluate(() => { document.documentElement.classList.remove('light'); document.documentElement.classList.add('dark') })
    const dark = await colors()
    expect(dark).not.toEqual(light)
    expect(dark.length).toBeGreaterThan(2)
    if (screenshots) await page.screenshot({ path: join(screenshots, width + '-markdown-dark.png'), animations: 'disabled' })
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.documentElement.classList.add('light') })
    const external = reading.getByRole('link', { name: /^external link/ })
    await expect(external).toHaveAttribute('target', '_blank')
    await expect(external).toHaveAttribute('data-external', '')
    await context.route('https://example.com/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>External document</h1>' }))
    const beforeExternal = page.url()
    const [externalPage] = await Promise.all([context.waitForEvent('page'), external.click()])
    await externalPage.waitForLoadState()
    expect(externalPage.url()).toBe('https://example.com/guide')
    expect(page.url()).toBe(beforeExternal)
    await externalPage.close()
    await reading.getByRole('link', { name: 'later section', exact: true }).click()
    await expect(reading.getByRole('heading', { name: 'Later section', exact: true })).toBeInViewport()
    const position = await reading.evaluate(element => element.scrollTop)
    await reading.getByRole('link', { name: 'Continue', exact: true }).click()
    await expect(reading.getByRole('heading', { name: 'Next steps', exact: true })).toBeVisible()
    expect(context.pages()).toHaveLength(1)
    await panel.getByRole('button', { name: 'Back to Reference guide', exact: true }).click()
    await expect(reading.getByRole('heading', { name: 'Later section', exact: true })).toBeInViewport()
    await expect.poll(async () => Math.abs(await reading.evaluate(element => element.scrollTop) - position)).toBeLessThan(3)
    await page.reload()
    await expect(reading.getByRole('heading', { name: 'Later section', exact: true })).toBeInViewport()
    await panel.getByRole('button', { name: 'View source', exact: true }).click()
    await expect(reading.locator('pre')).toContainText('# Reference guide')
    await panel.getByRole('button', { name: 'View document', exact: true }).click()
    await expect(reading.getByRole('heading', { name: 'Reference guide', exact: true })).toBeVisible()
    await page.goto(origin + '/?s=capability&e=capability:browse-catalog&rt=references')
    await panel.getByRole('link', { name: 'src/services/catalog.ts#CatalogService', exact: true }).click()
    await expect(reading.locator('.highlight')).toContainText('export class CatalogService')
    expect((await colors()).length).toBeGreaterThan(2)
    await expect(reading.locator('pre')).toHaveClass(/blr-source-code/)
    await reading.getByRole('button', { name: 'Copy code to clipboard' }).click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(readFileSync(join(project, 'src/services/catalog.ts'), 'utf8'))
    await reading.getByRole('link', { name: 'Line 2', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('f')).toMatch(/#L2$/)
    await expect(reading.locator('#L2')).toBeInViewport()
    if (screenshots) await page.screenshot({ path: join(screenshots, width + '-code.png'), animations: 'disabled' })
    const token = reading.locator('.shiki span[style]').first()
    const lightCode = await token.evaluate(element => getComputedStyle(element).color)
    await page.evaluate(() => { document.documentElement.classList.remove('light'); document.documentElement.classList.add('dark') })
    expect(await token.evaluate(element => getComputedStyle(element).color)).not.toBe(lightCode)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await reading.focus()
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await context.close()
    console.log(width + 'px: native prose, syntax colors, copy, links, anchors, Back, refresh, raw source, safety, and Escape passed')
  }
  expect(errors).toEqual([])
} finally {
  await browser.close()
  viewer.kill('SIGTERM')
  await new Promise(resolve => viewer.exitCode === null ? viewer.once('exit', resolve) : resolve())
  rmSync(project, { recursive: true, force: true })
}
