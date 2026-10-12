#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { brotliCompressSync, constants } from 'node:zlib'

const root = resolve(import.meta.dirname, '..')
const publicDir = join(root, '.output', 'public')
const indexFile = join(publicDir, 'index.html')

if (!existsSync(indexFile)) {
  console.error('[performance] Missing .output/public/index.html. Run `pnpm generate` first.')
  process.exit(1)
}

const html = readFileSync(indexFile, 'utf8')
const failures = []

// These are the content routes linked from the landing page. Route rules tell
// Nuxt that they are prerendered, so omitting their payloads makes link prefetch
// issue visible 404 responses and forces navigation to repeat the content query.
for (const route of [
  '/docs/product-model',
  '/docs/variations',
  '/blog/your-agent-is-guessing'
]) {
  const payload = join(publicDir, route.replace(/^\//, ''), '_payload.json')
  if (!existsSync(payload)) failures.push(`prerender payload is missing: ${route}/_payload.json`)
}

function brotliSize(input) {
  return brotliCompressSync(input, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 }
  }).length
}

function check(label, actual, maximum, unit = 'bytes') {
  if (actual > maximum) failures.push(`${label}: ${actual} ${unit} exceeds ${maximum} ${unit}`)
  console.log(`[performance] ${label}: ${actual} / ${maximum} ${unit}`)
}

function publicFile(url) {
  return join(publicDir, url.split(/[?#]/, 1)[0].replace(/^\//, ''))
}

function transferSize(file) {
  const contents = readFileSync(file)
  return extname(file) === '.svg' ? brotliSize(contents) : contents.length
}

const linkTags = [...html.matchAll(/<link\b[^>]*>/g)].map(match => match[0])
const modulePreloads = linkTags
  .filter(tag => /\brel="modulepreload"/.test(tag))
  .map(tag => tag.match(/\bhref="([^"]+)"/)?.[1])
  .filter(Boolean)
const preloadedScripts = [...new Set(modulePreloads)].map(publicFile)

for (const file of preloadedScripts) {
  if (!existsSync(file)) failures.push(`preloaded module is missing: ${file}`)
}

const preloadedJavaScriptBrotli = preloadedScripts
  .filter(existsSync)
  .reduce((total, file) => total + brotliSize(readFileSync(file)), 0)

// Raw and compressed are both checked because they fail for different reasons.
// The Brotli figure is what a visitor downloads and is the budget that protects
// them; the raw figure catches markup growth that compression would otherwise
// hide. Both ceilings sit a narrow margin above the last measured home page, so
// a change that grows it has to raise the ceiling here, deliberately.
check('root HTML', Buffer.byteLength(html), 148_000)
check('root HTML Brotli', brotliSize(html), 26_350)
check('module preloads', modulePreloads.length, 45, 'links')
// The initial module graph carries the Product Report schema, the hero's
// Blueprint picker, and the home page's content module. The ceiling keeps less
// than 1 KB of headroom above the last measurement (CI reads about 540 bytes
// above a local build), so later dependency growth stays visible. A lazy
// boundary around the product-knowledge section was measured and rejected: Nuxt
// still preloads its module and adds a hydration wrapper.
check('preloaded JavaScript Brotli', preloadedJavaScriptBrotli, 301_900)

const mobileHero = publicFile('/brand/heroes/product-model-mobile.webp')
if (!existsSync(mobileHero)) failures.push('responsive mobile hero is missing')
else check('mobile hero', statSync(mobileHero).size, 130_000)

for (const plate of [
  'from-your-repo.webp',
  'from-an-idea.webp',
  'from-a-blueprint.webp'
]) {
  const file = join(publicDir, 'brand', 'icons', 'ways', 'plates', plate)
  if (!existsSync(file)) failures.push(`hero plate is missing: ${plate}`)
  else check(`hero plate ${plate}`, statSync(file).size, 8_000)
}

const imageTags = [...html.matchAll(/<img\b[^>]*>/g)].map(match => match[0])
const resourceTypeImages = imageTags.filter(tag => tag.includes('/brand/icons/resource-types/'))
if (resourceTypeImages.length !== 7) {
  failures.push(`expected 7 illustrated main resource collection cards, found ${resourceTypeImages.length}`)
}
for (const tag of resourceTypeImages) {
  if (!tag.includes('loading="lazy"') || !tag.includes('fetchpriority="low"')) {
    failures.push(`below-fold resource type image is not low-priority and lazy: ${tag}`)
  }
}

const criticalImageUrls = new Set([
  '/brand/heroes/product-model-mobile.webp',
  ...imageTags
    .filter(tag => !tag.includes('loading="lazy"'))
    .map(tag => tag.match(/\bsrc="([^"]+)"/)?.[1])
    .filter(url => url?.startsWith('/') && url !== '/brand/heroes/product-model-wide.webp')
])
const criticalImageTransfer = [...criticalImageUrls]
  .map(publicFile)
  .filter(existsSync)
  .reduce((total, file) => total + transferSize(file), 0)
check('estimated mobile critical images', criticalImageTransfer, 190_000)

const hasMobileHeroPreload = linkTags.some(tag =>
  tag.includes('rel="preload"')
  && tag.includes('href="/brand/heroes/product-model-mobile.webp"')
  && tag.includes('media="(max-width: 1279px)"')
)
if (!hasMobileHeroPreload) {
  failures.push('mobile hero does not have a responsive preload')
}
if (!html.includes('<source media="(max-width: 1279px)" srcset="/brand/heroes/product-model-mobile.webp">')) {
  failures.push('mobile hero is not selected through a responsive picture source')
}
if (imageTags.some(tag => tag.includes('wordmark-3-dark.svg'))) {
  failures.push('the default page eagerly renders the hidden dark wordmark')
}

if (failures.length) {
  console.error('\n[performance] Budget check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[performance] All landing-page budgets passed.')
