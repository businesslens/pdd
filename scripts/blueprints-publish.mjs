#!/usr/bin/env node
/**
 * Push every Blueprint under `blueprints/` to the catalog, and withdraw the ones
 * that are no longer here.
 *
 * The maintainer runs this; contributors never do. It carries a real write
 * credential, which is why — unlike `businesslens pull` — it keeps an origin
 * allowlist. See docs/adr/0004 in the landing repository.
 *
 * Blast radius is one Blueprint per call: there is no reconcile endpoint. The
 * script reads the live slug set, PUTs what is on disk, and issues one DELETE
 * per missing slug, so a partial run can never unlist anything.
 */
import { execFileSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { redactSourceEvidence } from '../dist/report.js'

const root = process.cwd()
const cli = resolve(root, 'dist/cli.js')
const blueprintsDir = resolve(root, 'blueprints')

const args = process.argv.slice(2)
const assumeYes = args.includes('--yes')
const dryRun = args.includes('--dry-run')
const catalogArg = args.indexOf('--catalog')
const origin = catalogArg >= 0 ? args[catalogArg + 1] : process.env.BUSINESSLENS_CATALOG_URL ?? 'https://businesslens.io'

function fail(message) {
  console.error(`error: ${message}`)
  process.exit(1)
}

/**
 * The publish client keeps the allowlist that `pull` drops: this request carries
 * BUSINESSLENS_CATALOG_KEY, and a key must never be sent to an arbitrary host.
 */
function trustedCatalogOrigin(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    fail(`"${value}" is not a valid catalog origin.`)
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    fail('The catalog origin must be a bare origin with no credentials, path, query, or fragment.')
  }
  const loopback = url.hostname === 'localhost' || url.hostname === '::1' || /^127(\.\d+){3}$/.test(url.hostname)
  if (url.protocol === 'https:' || (loopback && url.protocol === 'http:')) return url.origin
  fail('The catalog origin must use https, except on a loopback host.')
}

const catalog = trustedCatalogOrigin(origin)
const isLoopbackCatalog = /^https?:\/\/(localhost|127(\.\d+){3}|\[?::1\]?)(:\d+)?$/.test(catalog)
const key = process.env.BUSINESSLENS_CATALOG_KEY
if (!key) fail('BUSINESSLENS_CATALOG_KEY is not set.')

function git(...gitArgs) {
  return execFileSync('git', ['-C', root, ...gitArgs], { encoding: 'utf8' }).trim()
}

// A publish is a production write derived from the working tree, so the working
// tree has to be exactly what review approved. A loopback catalog is a developer
// round trip against their own machine, where insisting on a clean main would
// only mean you cannot test the branch you are working on.
const branch = git('rev-parse', '--abbrev-ref', 'HEAD')
const dirty = Boolean(git('status', '--porcelain'))
if (isLoopbackCatalog) {
  if (dirty || branch !== 'main') {
    console.warn(`note: publishing ${dirty ? 'a dirty tree' : 'a clean tree'} from "${branch}" to a local catalog.`)
  }
} else {
  if (dirty) fail('The working tree is dirty. Publish from a clean checkout.')
  if (branch !== 'main') fail(`Publish runs from main, not "${branch}". Merging a contribution is what approves it.`)
}
const commit = git('rev-parse', 'HEAD')

if (!existsSync(blueprintsDir)) fail('No blueprints/ directory.')
const slugs = (await readdir(blueprintsDir, { withFileTypes: true }))
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort()

async function request(method, path, body) {
  const response = await fetch(new URL(path, catalog), {
    method,
    headers: {
      authorization: `Bearer ${key}`,
      ...(body ? { 'content-type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${response.status} ${(await response.text()).slice(0, 200)}`)
  }
  return response.status === 204 ? undefined : response.json()
}

// Build everything before touching the catalog. A build failure must abort the
// run before any DELETE, or a broken checkout could withdraw live Blueprints.
const payloads = []
for (const slug of slugs) {
  const dir = join(blueprintsDir, slug)
  const manifest = parseYaml(await readFile(join(dir, 'blueprint.yaml'), 'utf8'))
  try {
    execFileSync(process.execPath, [cli, '--cwd', dir, 'build'], { stdio: 'pipe' })
  } catch (error) {
    fail(`blueprints/${slug}: build failed — ${(error.stderr || error.message).toString().trim()}`)
  }
  // Redact here as well as server-side. The catalog does not trust this client,
  // but source paths should not travel over the wire in the first place.
  const report = redactSourceEvidence(
    JSON.parse(await readFile(join(dir, '.businesslens/build/report.json'), 'utf8'))
  )
  payloads.push({ slug, manifest, report, sourcePath: `blueprints/${slug}`, sourceCommit: commit })
  console.log(`built  ${slug}`)
}

let live = []
try {
  live = (await request('GET', '/api/v1/catalog/blueprints')).blueprints.map(entry => entry.slug)
} catch (error) {
  fail(`Could not read the live catalog: ${error.message}`)
}

const missing = live.filter(slug => !slugs.includes(slug))

console.log(`\ncatalog ${catalog}`)
console.log(`commit  ${commit.slice(0, 12)}`)
console.log(`publish ${payloads.length}: ${slugs.join(', ') || '(none)'}`)
console.log(`withdraw ${missing.length}: ${missing.join(', ') || '(none)'}`)

if (dryRun) process.exit(0)

if (!assumeYes) {
  if (!process.stdin.isTTY) fail('Refusing to publish without confirmation in a non-interactive session. Pass --yes.')
  const readline = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await readline.question('Proceed? [y/N] ')
  readline.close()
  if (!/^y(es)?$/i.test(answer.trim())) {
    console.log('Aborted.')
    process.exit(1)
  }
}

for (const payload of payloads) {
  await request('PUT', `/api/v1/catalog/blueprints/${payload.slug}`, payload)
  console.log(`published ${payload.slug}`)
}
for (const slug of missing) {
  await request('DELETE', `/api/v1/catalog/blueprints/${slug}`)
  console.log(`withdrew  ${slug}`)
}

console.log(`\nDone. ${payloads.length} published, ${missing.length} withdrawn.`)
