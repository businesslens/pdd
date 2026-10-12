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
// them; the raw figure protects the server's render and catches markup growth
// that compression would otherwise hide.
//
// Raised from 135_000 for issue #22, which put a worded label on both halves of
// all six comparison rows and gave the phone a labelled loop. Raw grew 5,835
// bytes against 582 of Brotli — twelve repetitions of two strings, and rules
// that only apply under a media query, are close to free once compressed. The
// compressed ceiling is deliberately left where it was: if a change ever costs
// real transfer, that is the line it has to answer to.
//
// Issue #24 added the request-scoped TanStack Query dehydration envelope used
// by every oRPC-backed page. Its empty root-page state costs 57 raw bytes; the
// compressed HTML ceiling is unchanged, so content growth still has to fit the
// existing transfer budget.
//
// The updates opt-in adds a ClientOnly lazy boundary to the shared footer. The
// form itself stays out of the server render and initial client graph, while
// Nuxt's loader and payload metadata add 689 raw bytes but only 52 compressed
// bytes against main. Keep the compressed ceiling unchanged and account for
// the structural markup explicitly here.
//
// The earlier Product Model grouping omitted a separate Scenario card.
// That responsive grouping markup added 65 raw bytes to
// the measured root page; retain a narrow ceiling above that result.
//
// Consuming the published Product Report v13 layer changes Nuxt's generated
// root metadata by 17 raw bytes. Brotli transfer, preload count, and JavaScript
// remain below their existing ceilings; keep those budgets unchanged and leave
// less than 100 raw bytes of structural headroom.
//
// The Entities card now carries its plate, so the last empty placeholder band
// became a lazy image tag: 141,102 measured raw bytes. Keep the same narrow
// headroom above that result.
//
// The centered header now renders documentation search and Vocabulary on the
// home page too. Its controls and shared panel loader bring the measured HTML
// to 144,957 raw bytes and 25,415 Brotli bytes.
//
// Readers can now dismiss the term tooltips, and the link the dismissal toast
// raises is styled globally because that toast is rendered outside the component
// that raises it. Those rules ride in the inlined stylesheet on every page that
// mounts the header, taking the measured HTML to 145,151 raw bytes and 25,434
// Brotli bytes. Account for them with 99 raw bytes of headroom; retain the
// compressed HTML and preload ceilings.
// Consuming pdd-kit 0.15.0 adds the report's slideover, Markdown, and
// syntax-preview chunks to the Blueprint route, and Nuxt now prefetches
// twenty-five more lazy scripts from the home page's links: 145,456 raw bytes
// and 25,609 Brotli bytes. Keep the narrow raw headroom and every other ceiling.
// The published pdd-kit 0.23.0 splits the report into more lazy chunks, so
// the home page prefetches 63 scripts from its links, and the docs draw the
// home page's loop: 147,189 raw bytes and 25,721 Brotli bytes. Keep the narrow
// raw headroom.
// The approved product-knowledge section adds a heading, illustration, five-row
// table, and shared table CSS. With the latest PDD docs, it measures 147,809 raw
// bytes and 26,174 Brotli bytes. Retain narrow headroom for this added content;
// its illustration is lazy and does not enter the critical-image budget.
check('root HTML', Buffer.byteLength(html), 148_000)
check('root HTML Brotli', brotliSize(html), 26_350)
check('module preloads', modulePreloads.length, 45, 'links')
// Issue #24 replaced ad-hoc fetch state with the shared oRPC OpenAPI client and
// TanStack Query cache. That client/runtime boundary adds 6,895 Brotli bytes to
// the initial module graph; keep less than 1.2 KB of headroom above the measured
// migration so later dependencies cannot ride along unnoticed.
//
// The shared footer's client-only lazy loader adds one preload and 2,206 Brotli
// bytes against main. The form chunk and its UI/data dependencies remain
// deferred; allow the measured loader cost with less than 1 KB of headroom.
//
// Product Report v13's Entity, lifecycle, Step-effect, and permission readings
// bring the measured initial graph to 287,510 bytes. Keep less than 500 bytes of
// headroom so later dependency growth remains visible.
// Global lookup controls bring this graph to 289,222 Brotli bytes, 1,712 above
// the v13 measurement. Keep less than 300 bytes of headroom for this addition.
// Product Report v15 (pdd-kit 0.23.0) adds Variations, nested Screens,
// shows/collects, Step facts, languages and the new Coverage shape to the schema
// the entry chunk carries, bringing the graph to 296,520 Brotli bytes. Keep less
// than 300 bytes of headroom so later dependency growth remains visible.
// Issue #84 gave each of the seven Product Model cards three examples, which
// ride in the home page's content module: 296,824 Brotli bytes measured in CI,
// 157 above main. Keep less than 300 bytes of headroom.
// The map-first hero adds the Blueprint picker to the pull step: the slug opens
// a menu of the catalog, and the command block learns to stay on one line. It
// is bundled with the hero, not lazy: as its own chunk it split shared Reka
// primitives out of the home graph into three more preloads. Measured locally
// at 3,690 Brotli bytes above main (296,283 → 299,973); CI reads about 540
// above local. Keep less than 300 bytes of headroom above the CI figure.
// The product-knowledge section measures 301,120 locally. Keep the established
// roughly 540-byte CI allowance plus less than 300 bytes of headroom. A lazy
// component boundary was measured too, but increased the initial graph because
// Nuxt still preloads its SSR module and adds the hydration wrapper.
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
