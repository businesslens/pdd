#!/usr/bin/env node
/** Exercise already-built, packed Nuxt consumers with SSR and the real ELK worker.
 * node scripts/check-packed-diagrams.mjs /tmp/npm-consumer /tmp/pnpm-consumer
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium, expect } from '@playwright/test'

const consumers = process.argv.slice(2)
if (!consumers.length) throw new Error('Pass the directories of built packed Nuxt consumers.')
const browser = await chromium.launch()
const errors = []

async function availablePort() {
  const server = createServer()
  await new Promise((accept, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', accept) })
  const port = server.address().port
  await new Promise(accept => server.close(accept))
  return port
}

try {
  for (const consumer of consumers) {
    const port = await availablePort()
    const origin = `http://127.0.0.1:${port}`
    const server = spawn(process.execPath, [resolve(consumer, '.output/server/index.mjs')], {
      cwd: consumer, env: { ...process.env, NITRO_HOST: '127.0.0.1', NITRO_PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe']
    })
    let output = ''
    server.stdout.on('data', chunk => { output += chunk })
    server.stderr.on('data', chunk => { output += chunk })
    const context = await browser.newContext()
    try {
      await expect.poll(async () => {
        if (server.exitCode !== null) throw new Error(output)
        try { return (await fetch(origin)).status } catch { return 0 }
      }, { timeout: 15000 }).toBe(200)
      const page = await context.newPage()
      const workers = []
      page.on('pageerror', error => errors.push({ consumer, message: error.message }))
      page.on('console', message => { if (/hydration/i.test(message.text())) errors.push({ consumer, message: message.text() }) })
      page.on('request', request => { if (request.url().includes('diagram.worker')) workers.push(request.url()) })
      await page.goto(`${origin}/?s=topology`)
      await expect(page.getByRole('heading', { name: 'Domain map', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Topology', exact: true })).toHaveCount(0)
      expect(workers).toHaveLength(0)
      const ssr = await fetch(`${origin}/?s=topology&tv=what-it-keeps&multi=1`).then(response => response.text())
      expect(ssr).toContain('Arranging diagram')
      expect(ssr).toContain('knows M:N')
      await page.goto(`${origin}/?s=topology&tv=what-it-keeps&multi=1`)
      await expect(page.locator('[data-flow-ready="true"]')).toHaveCount(2, { timeout: 15000 })
      const ids = await page.locator('[data-flow-ready="true"] svg [id]').evaluateAll(items => items.map(item => item.id))
      expect(new Set(ids).size).toBe(ids.length)
      expect(ids.length).toBeGreaterThanOrEqual(2)
      expect(workers).toHaveLength(2)
      await page.locator('.vue-flow__node .blr-flow-node__main').first().click()
      await expect(page).toHaveURL(/e=entity/)
      await page.goBack()
      await expect(page.locator('[data-flow-ready="true"]')).toHaveCount(2)
      await page.goto(`${origin}/?s=entity&e=entity%3Areader&t=lifecycle`)
      await expect(page.locator('.vue-flow__node .blr-flow-node__main')).toHaveCount(2)
      await expect(page.locator('.vue-flow__node:has([data-unreached="true"])')).toHaveCount(1)
      await page.reload()
      await expect(page.locator('[data-flow-ready="true"]')).toHaveCount(1)
      await page.goto(`${origin}/?catalog=1&tab=topology&tv=sitemap`)
      await expect(page).toHaveURL(/tab=interface.*t=map/)
      await expect(page.locator('[data-flow-ready="true"]')).toHaveCount(1)
      await page.locator('.blr-navitem').filter({ hasText: /^Entities/ }).click()
      await page.getByRole('button', { name: 'Relationships', exact: true }).click()
      await expect(page).toHaveURL(/tab=entity.*t=relationships/)
      await page.goBack()
      await expect(page).toHaveURL(/tab=entity/)
      await page.goBack()
      await expect(page).toHaveURL(/tab=interface.*t=map/)
      await page.reload()
      await expect(page.getByRole('heading', { name: 'Interface map', exact: true })).toBeVisible()
      console.log(`Passed ${consumer}: SSR, hydration, lazy worker, multiple instances, navigation and isolated States.`)
    } finally {
      await context.close()
      server.kill('SIGTERM')
      await Promise.race([new Promise(accept => server.once('exit', accept)), delay(2000).then(() => { if (server.exitCode === null) server.kill('SIGKILL') })])
    }
  }
  expect(errors).toEqual([])
} finally { await browser.close() }
