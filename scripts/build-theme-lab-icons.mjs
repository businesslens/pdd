/** Build the favicon/install-icon family for every shared theme-lab mark. */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LAYER = resolve(ROOT, 'layers/nuxt/theme-lab')
const { chromium } = createRequire(`${ROOT}/package.json`)('@playwright/test')
const { default: markManifest } = await import(new URL(
  '../layers/nuxt/theme-lab/app/utils/businesslensThemeLabMarks.mjs',
  import.meta.url
))
const { defaultMark: DEFAULT_MARK, marks: MARK_VARIANTS } = markManifest

const ARTWORK = resolve(LAYER, 'public/brand/logo/variants')
const ICONS = resolve(LAYER, 'public/brand/icons')
const MARKS = resolve(ICONS, 'marks')
const PAPER = '#f2eee5'
const PAGE = '#f4ecdb'
const RADIUS = 0.165
const ELEMENT = /<(?:rect|circle|ellipse|path|polygon)\b[^>]*\/>/g
const FILL = /\bfill="([^"]*)"/
/** Air added between the letters of a tab icon, as a share of the mark height. The
 *  ligature spacing that reads well at logo size closes into one blob at 16px. */
const TAB_GAP = 0.05
const round = (number, precision = 3) => Number(number.toFixed(precision))

function readVariant(file) {
  const light = readFileSync(resolve(ARTWORK, `${file}.svg`), 'utf8')
  const dark = readFileSync(resolve(ARTWORK, `${file}-dark.svg`), 'utf8')
  const elements = light.match(ELEMENT) ?? []
  const darkElements = dark.match(ELEMENT) ?? []
  if (!elements.length || elements.length !== darkElements.length) {
    throw new Error(`${file} light/dark artwork does not have matching drawable elements`)
  }

  const viewBox = light.match(/viewBox="([^"]+)"/)?.[1]
  if (!viewBox) throw new Error(`${file}.svg has no viewBox`)
  const [x, y, width, height] = viewBox.trim().split(/\s+/).map(Number)
  const first = elements[0]
  const box = first.startsWith('<rect') ? Number(first.match(/\bwidth="([\d.]+)"/)?.[1] ?? 0) : 0

  return {
    elements,
    darkElements,
    box: { x, y, width, height },
    container: box / width > 0.95
  }
}

/** Rough extents of a drawable. Control points overshoot the ink slightly, which is
 *  close enough to tell one letter from the next. */
function extents(element) {
  const attribute = name => Number(element.match(new RegExp(`\\b${name}="(-?[\\d.]+)"`))?.[1] ?? 0)
  if (element.startsWith('<rect')) {
    return {
      x0: attribute('x'),
      x1: attribute('x') + attribute('width'),
      y0: attribute('y'),
      y1: attribute('y') + attribute('height')
    }
  }
  if (element.startsWith('<circle') || element.startsWith('<ellipse')) {
    const rx = attribute('r') || attribute('rx')
    const ry = attribute('r') || attribute('ry')
    return {
      x0: attribute('cx') - rx,
      x1: attribute('cx') + rx,
      y0: attribute('cy') - ry,
      y1: attribute('cy') + ry
    }
  }
  const numbers = (element.match(/\b(?:d|points)="([^"]+)"/)?.[1] ?? '').match(/-?[\d.]+/g) ?? []
  const axis = parity => numbers.filter((_, index) => index % 2 === parity).map(Number)
  return {
    x0: Math.min(...axis(0)),
    x1: Math.max(...axis(0)),
    y0: Math.min(...axis(1)),
    y1: Math.max(...axis(1))
  }
}

/** Split a mark into the letters that can be pulled apart: drawables that never overlap
 *  horizontally, with short punctuation riding along with the letter it follows. A mark
 *  drawn inside a container reads as one column and so is left untouched. */
function letters(elements) {
  const spans = elements.map((element, index) => ({ index, ...extents(element) }))
  const spread = []
  for (const span of [...spans].sort((first, second) => first.x0 - second.x0)) {
    const last = spread[spread.length - 1]
    if (last && span.x0 <= last.x1) {
      last.x1 = Math.max(last.x1, span.x1)
      last.height = Math.max(last.height, span.y1 - span.y0)
      last.members.push(span.index)
    } else {
      spread.push({ x1: span.x1, height: span.y1 - span.y0, members: [span.index] })
    }
  }

  const tallest = Math.max(...spread.map(column => column.height))
  return spread.reduce((columns, column) => {
    const previous = columns[columns.length - 1]
    if (previous && column.height < tallest / 2) previous.members.push(...column.members)
    else columns.push(column)
    return columns
  }, [])
}

function compose(variant, { size, fit, plate, gap = 0 }) {
  const columns = gap ? letters(variant.elements) : []
  const step = columns.length > 1 ? gap : 0
  const shifts = new Map()
  columns.forEach((column, index) => {
    const dx = (index - (columns.length - 1) / 2) * step
    for (const member of column.members) shifts.set(member, dx)
  })
  const widened = step * (columns.length - 1)
  const box = { ...variant.box, x: variant.box.x - widened / 2, width: variant.box.width + widened }
  const scale = (size * fit) / Math.max(box.width, box.height)
  const x = size / 2 - scale * (box.x + box.width / 2)
  const y = size / 2 - scale * (box.y + box.height / 2)
  const swaps = []
  const elements = variant.elements.map((element, index) => {
    const light = element.match(FILL)?.[1]
    const dark = variant.darkElements[index].match(FILL)?.[1]
    let drawable = element
    if (light && dark && light !== dark.trim()) {
      swaps.push(`.d${index}{fill:${dark}}`)
      drawable = element.replace(/^<(\w+)/, `<$1 class="d${index}"`)
    }
    const shift = shifts.get(index) ?? 0
    return shift ? `<g transform="translate(${round(shift)} 0)">${drawable}</g>` : drawable
  })
  const style = swaps.length && !plate
    ? `<style>@media(prefers-color-scheme:dark){${swaps.join('')}}</style>`
    : ''
  const backdrop = plate === 'round'
    ? `<rect width="${size}" height="${size}" rx="${round(size * RADIUS)}" fill="${PAPER}"/>`
    : plate === 'square'
      ? `<rect width="${size}" height="${size}" fill="${PAPER}"/>`
      : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="BusinessLens">
${[style, backdrop].filter(Boolean).join('\n')}
<g transform="translate(${round(x)} ${round(y)}) scale(${round(scale, 6)})">
${elements.map(element => `  ${element}`).join('\n')}
</g>
</svg>
`
}

function manifest(id) {
  return `${JSON.stringify({
    name: 'BusinessLens',
    short_name: 'BusinessLens',
    description: 'Living, machine-readable Product Models for software teams and coding agents.',
    start_url: '/',
    display: 'standalone',
    background_color: PAGE,
    theme_color: PAGE,
    icons: [
      { src: `/brand/icons/marks/${id}/favicon.svg`, sizes: 'any', type: 'image/svg+xml' },
      { src: `/brand/icons/marks/${id}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `/brand/icons/marks/${id}/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `/brand/icons/marks/${id}/maskable-icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }, null, 2)}\n`
}

function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach(({ size, data }, index) => {
    const at = 6 + index * 16
    header.writeUInt8(size, at)
    header.writeUInt8(size, at + 1)
    header.writeUInt16LE(1, at + 4)
    header.writeUInt16LE(32, at + 6)
    header.writeUInt32LE(data.length, at + 8)
    header.writeUInt32LE(offset, at + 12)
    offset += data.length
  })
  return Buffer.concat([header, ...images.map(image => image.data)])
}

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })

async function raster(markup, size) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`
  )
  return page.screenshot({ omitBackground: true })
}

const composed = new Map()
for (const mark of MARK_VARIANTS) {
  const variant = readVariant(mark.file)
  const directory = resolve(MARKS, mark.id)
  mkdirSync(directory, { recursive: true })
  const tab = compose(variant, {
    size: 64,
    fit: variant.container ? 1 : 0.94,
    plate: null,
    gap: TAB_GAP * variant.box.height
  })
  const app = compose(variant, { size: 512, fit: variant.container ? 1 : 0.7, plate: 'round' })
  const maskable = compose(variant, { size: 512, fit: variant.container ? 0.78 : 0.55, plate: 'square' })
  composed.set(mark.id, { app, maskable })
  writeFileSync(resolve(directory, 'favicon.svg'), tab)
  writeFileSync(resolve(directory, 'site.webmanifest'), manifest(mark.id))

  const images = []
  for (const size of [16, 32, 48]) images.push({ size, data: await raster(tab, size) })
  writeFileSync(resolve(directory, 'favicon.ico'), ico(images))
  writeFileSync(resolve(directory, 'favicon-32.png'), images[1].data)
  for (const [markup, size, name] of [
    [app, 180, 'apple-touch-icon.png'],
    [app, 192, 'icon-192.png'],
    [app, 512, 'icon-512.png'],
    [maskable, 512, 'maskable-icon-512.png']
  ]) {
    writeFileSync(resolve(directory, name), await raster(markup, size))
  }
  const columns = letters(variant.elements).length
  console.log(
    `${mark.id.padEnd(4)} ${mark.name.padEnd(9)} from ${mark.file.padEnd(8)}`
    + ` tab ${columns > 1 ? `spreads ${columns} letters` : 'is one shape, unspread'}`
  )
}

const { app: defaultApp, maskable: defaultMaskable } = composed.get(DEFAULT_MARK)
writeFileSync(resolve(ICONS, 'businesslens-app-icon.svg'), defaultApp)
writeFileSync(resolve(ICONS, 'businesslens-maskable-icon.svg'), defaultMaskable)
writeFileSync(resolve(ICONS, 'icon-1024.png'), await raster(defaultApp, 1024))
await browser.close()

for (const name of [
  'favicon.svg',
  'favicon.ico',
  'favicon-32.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'maskable-icon-512.png'
]) {
  copyFileSync(resolve(MARKS, DEFAULT_MARK, name), resolve(ICONS, name))
}
copyFileSync(resolve(MARKS, DEFAULT_MARK, 'favicon.ico'), resolve(LAYER, 'public/favicon.ico'))
writeFileSync(resolve(LAYER, 'public/site.webmanifest'), manifest(DEFAULT_MARK))

console.log(`\ndefault mark ${DEFAULT_MARK} copied to the theme-lab fallback paths`)
