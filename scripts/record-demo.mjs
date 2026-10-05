#!/usr/bin/env node
/**
 * Record the README demo: a short looping GIF touring the local Product Report.
 *
 * It serves the `content-feed-reader` Blueprint with the real `view` command
 * (through `view-fixture.mjs`, which gives the Blueprint a repository of its
 * own), drives one session through the report with Playwright at fixed pacing,
 * and records it frame by frame. Playwright draws no pointer, so a visible one
 * is injected into the page and follows the real mouse events.
 *
 * Frames come from Chromium's screencast rather than Playwright's video, which
 * is too soft for small text. Each frame keeps its timestamp, the timeline is
 * resampled at a constant rate, and ffmpeg converts it with a two-pass palette.
 *
 * Every beat is current report behavior; nothing is mocked. The opening
 * terminal prints the `view` command's own output, captured from the server.
 *
 * Requires a build (`npm run build`), Playwright's Chromium and ffmpeg.
 * Usage: npm run demo:record [-- [--out <gif>] [--frames <dir>]]
 */
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const model = 'blueprints/content-feed-reader'
const size = { width: 1280, height: 720 }
const fps = 12
let out = resolve(root, '.github/demo.gif')
let keepFrames
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index]
  if (arg === '--out') out = resolve(process.argv[++index] ?? '')
  else if (arg === '--frames') keepFrames = resolve(process.argv[++index] ?? '')
  else throw new Error(`Unknown argument ${arg}`)
}

if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) {
  throw new Error('ffmpeg is missing or does not run.')
}

/* ---------------------------------------------------------------- server */

/** Serve the Blueprint and resolve with the lines `view` itself printed. */
function serve() {
  const child = spawn(process.execPath, [join(root, 'scripts/view-fixture.mjs'), model, '--no-open'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'inherit']
  })
  return new Promise((resolveServer, reject) => {
    let output = ''
    child.on('exit', code => reject(new Error(`view exited with ${code} before it was ready`)))
    child.stdout.on('data', chunk => {
      output += chunk
      const lines = output.split('\n').map(line => line.trimEnd())
      const start = lines.findIndex(line => line.includes('http://'))
      if (start === -1 || !lines.some(line => line.startsWith('Press Ctrl+C'))) return
      child.removeAllListeners('exit')
      resolveServer({
        child,
        url: lines[start].match(/https?:\/\/\S+/)[0],
        printed: lines.slice(start).filter(Boolean)
      })
    })
  })
}

/* ---------------------------------------------------------------- page aids */

/** A visible pointer that follows real mouse events and pulses on press. */
function installPointer() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">'
    + '<path d="M3 2 L3 18 L7.2 14.2 L10 20.4 L12.8 19.2 L10.1 13.1 L15.8 13.1 Z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>'
  const css = `
    #demo-pointer { position: fixed; left: 0; top: 0; z-index: 2147483647; pointer-events: none;
      width: 22px; height: 22px; margin: -2px 0 0 -3px; display: none;
      filter: drop-shadow(0 1px 2px rgb(0 0 0 / .35)); }
    #demo-pointer[data-shown] { display: block; }
    #demo-pointer::before { content: ''; position: absolute; left: -11px; top: -11px; width: 28px; height: 28px;
      border-radius: 50%; background: rgb(59 130 246 / .35); transform: scale(0); opacity: 0;
      transition: transform .18s ease-out, opacity .3s ease-out; }
    #demo-pointer[data-pressed]::before { transform: scale(1); opacity: 1; transition: transform .08s ease-out; }`
  const mount = () => {
    if (document.getElementById('demo-pointer')) return
    const style = document.createElement('style')
    style.textContent = css
    const pointer = document.createElement('div')
    pointer.id = 'demo-pointer'
    pointer.innerHTML = svg
    document.documentElement.append(style, pointer)
  }
  const pointer = () => { mount(); return document.getElementById('demo-pointer') }
  addEventListener('mousemove', event => {
    const element = pointer()
    element.dataset.shown = ''
    element.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
  }, true)
  addEventListener('mousedown', () => { pointer().dataset.pressed = '' }, true)
  addEventListener('mouseup', () => { setTimeout(() => delete pointer().dataset.pressed, 120) }, true)
}

/** The opening terminal, drawn over the already loaded report. */
function showTerminal() {
  const overlay = document.createElement('div')
  overlay.id = 'demo-terminal'
  overlay.innerHTML = `
    <style>
      #demo-terminal { position: fixed; inset: 0; z-index: 2147483646; display: grid; place-items: center;
        background: #e9e3d6; font: 20px/1.55 ui-monospace, Menlo, "IBM Plex Mono", monospace; }
      #demo-terminal .window { width: 900px; border-radius: 12px; overflow: hidden; background: #1d1b19;
        box-shadow: 0 24px 60px rgb(0 0 0 / .28); }
      #demo-terminal .bar { display: flex; gap: 8px; padding: 14px 16px; background: #2a2724; }
      #demo-terminal .bar i { width: 12px; height: 12px; border-radius: 50%; background: #5a544d; }
      #demo-terminal pre { margin: 0; padding: 22px 28px 30px; min-height: 190px; color: #ece6da; white-space: pre-wrap; font: inherit; }
      #demo-terminal .prompt { color: #9bbf85; }
      #demo-terminal .url { color: #8ab4f8; text-decoration: underline; }
      #demo-terminal .caret { display: inline-block; width: .6em; height: 1.1em; vertical-align: -.2em; background: #ece6da; }
    </style>
    <div class="window"><div class="bar"><i></i><i></i><i></i></div><pre></pre></div>`
  document.documentElement.append(overlay)
}

/* ---------------------------------------------------------------- recording */

const server = await serve()
const browser = await chromium.launch()
const work = mkdtempSync(join(tmpdir(), 'bl-demo-'))
try {
  const context = await browser.newContext({ viewport: size, deviceScaleFactor: 1 })
  /* The default light background, pinned so a changed default cannot slip into the GIF unnoticed. */
  await context.addCookies([{ name: 'bl-bg-light', value: 'l4', url: server.url }])
  await context.addInitScript(installPointer)
  const page = await context.newPage()
  page.setDefaultTimeout(15_000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))

  await page.goto(server.url)
  await page.getByRole('heading', { level: 1, name: /Overview/ }).waitFor()
  const background = await page.evaluate(() => document.documentElement.dataset.bgLight)
  if (background !== 'l4') throw new Error(`Expected the Glow background (l4), got ${background}`)
  await page.evaluate(showTerminal)
  await page.waitForTimeout(300)

  /* Screencast frames arrive only when the screen changes; each keeps its time. */
  const frames = []
  const cdp = await context.newCDPSession(page)
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    frames.push({ time: metadata.timestamp, data })
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'png', maxWidth: size.width, maxHeight: size.height, everyNthFrame: 1 })
  const started = Date.now()
  const beats = []
  const beat = name => beats.push({ name, at: (Date.now() - started) / 1000 })
  const hold = ms => page.waitForTimeout(ms)

  /* The pointer glides with easing over a fixed time; Playwright's own moves are linear. */
  let pointer = { x: 760, y: 420 }
  async function glide(x, y, ms = 320) {
    const from = pointer
    const begun = Date.now()
    for (let t = 0; t < 1;) {
      t = Math.min(1, (Date.now() - begun) / ms)
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
      await page.mouse.move(from.x + (x - from.x) * eased, from.y + (y - from.y) * eased)
      if (t < 1) await hold(16)
    }
    pointer = { x, y }
  }
  async function click(locator, { ms = 320, dx = 0.5 } = {}) {
    await locator.waitFor({ state: 'visible' })
    const box = await locator.boundingBox()
    await glide(box.x + box.width * dx, box.y + box.height / 2, ms)
    await hold(60)
    await page.mouse.down()
    await hold(60)
    await page.mouse.up()
  }
  const rail = name => page.locator('.blr-navitem', { hasText: name })
  /* Each collection opens on its List; the picker then draws the same set another way. */
  async function collection(name, drawing, title) {
    beat(`${name}: List → ${title}`)
    await click(rail(name), { ms: 450, dx: 0.3 })
    await page.getByRole('heading', { level: 1, name: new RegExp(name) }).waitFor()
    await hold(1100)
    await click(page.locator('[data-view-trigger]'))
    await hold(400)
    await click(page.getByRole('button', { name: `Draw as ${drawing}`, exact: true }), { dx: 0.3 })
    await page.locator('[data-drawing-switch]').and(page.locator(`[data-current-drawing=${drawing}]`)).waitFor()
  }
  const expand = id => click(page.locator(`.vue-flow__node[data-id="${id}"] .blr-flow-node__count`), { ms: 450 })

  // 0–4.5 s: one command, private and local.
  beat('Terminal')
  const terminal = page.locator('#demo-terminal pre')
  const command = 'npx businesslens view'
  for (let typed = 0; typed <= command.length; typed += 1) {
    await terminal.evaluate((element, text) => {
      element.innerHTML = `<span class="prompt">~/content-feed-reader $</span> ${text}<span class="caret"></span>`
    }, command.slice(0, typed))
    await hold(35)
  }
  await hold(300)
  await terminal.evaluate((element, { command, printed }) => {
    const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    const lines = printed.map(line => escape(line).replace(/(https?:\/\/\S+)/, '<span class="url">$1</span>'))
    element.innerHTML = `<span class="prompt">~/content-feed-reader $</span> ${command}\n${lines.join('\n')}\n<span class="caret"></span>`
  }, { command, printed: server.printed })
  await hold(3300)
  await page.evaluate(() => document.getElementById('demo-terminal').remove())

  // What the product is.
  beat('Product Overview')
  await page.mouse.move(pointer.x, pointer.y)
  await hold(400)
  await glide(520, 180, 700)
  await hold(1200)

  // One set, several drawings: each section for a few seconds.
  await collection('Entities', 'graph', 'Relationships')
  await page.locator('[data-flow-ready=true]').waitFor()
  await glide(820, 560, 500)
  await hold(2000)

  await collection('Capabilities', 'matrix', 'Delivery')
  await hold(2500)

  await collection('Interfaces', 'graph', 'Delivery map')
  await page.locator('[data-flow-ready=true]').waitFor()
  await hold(500)
  await expand('interface:reader-web')
  await hold(800)
  await expand('experience:reader-web::public-reading')
  await hold(800)
  await expand('interface:reader-mobile')
  await hold(300)
  /* A hovered or focused node dims the rest; the grown map is read with neither. */
  await glide(420, 600, 450)
  await page.evaluate(() => document.activeElement?.blur())
  await hold(1800)

  await collection('Business Rules', 'matrix', 'Attachments')
  await hold(2500)
  beat('End')

  await cdp.send('Page.stopScreencast')
  if (errors.length) throw new Error(`The report raised errors:\n${errors.join('\n')}`)

  /* Resample the change-driven frames onto a constant timeline. */
  const framesDir = keepFrames ?? join(work, 'frames')
  rmSync(framesDir, { recursive: true, force: true })
  mkdirSync(framesDir, { recursive: true })
  const first = frames[0].time
  const last = frames.at(-1).time
  const end = Math.max(last - first, beats.at(-1).at)
  let source = 0
  let count = 0
  for (let time = 0; time <= end; time += 1 / fps) {
    while (source + 1 < frames.length && frames[source + 1].time - first <= time) source += 1
    count += 1
    writeFileSync(join(framesDir, `${String(count).padStart(5, '0')}.png`), Buffer.from(frames[source].data, 'base64'))
  }

  /* Two-pass palette: one palette for the whole loop, then only changed rectangles. */
  const pattern = join(framesDir, '%05d.png')
  const palette = join(work, 'palette.png')
  const ffmpeg = (...args) => {
    const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
    if (result.status !== 0) throw new Error(`ffmpeg ${args.join(' ')} failed`)
  }
  ffmpeg('-framerate', String(fps), '-i', pattern, '-vf', 'palettegen=max_colors=256:stats_mode=diff', palette)
  mkdirSync(dirname(out), { recursive: true })
  ffmpeg('-framerate', String(fps), '-i', pattern, '-i', palette,
    '-lavfi', 'paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle', '-loop', '0', out)

  console.log(`Wrote ${relative(root, out)}: ${(statSync(out).size / 1024 / 1024).toFixed(2)} MB, ${count} frames at ${fps} fps (${(count / fps).toFixed(1)} s)`)
  for (const { name, at } of beats) console.log(`  ${at.toFixed(1).padStart(5)} s  ${name}`)
} finally {
  await browser.close()
  server.child.kill('SIGTERM')
  rmSync(work, { recursive: true, force: true })
}
