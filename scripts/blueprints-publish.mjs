#!/usr/bin/env node
/**
 * Push every Blueprint under `blueprints/` to the catalog, and withdraw the ones
 * that are no longer here.
 *
 * The maintainer runs this; contributors never do. It carries a real write
 * credential, which is why — unlike `businesslens blueprint pull` — it keeps
 * an origin allowlist. See docs/adr/0004 in the landing repository.
 *
 * Blast radius is one Blueprint per call: there is no reconcile endpoint. The
 * script reads the live slug set, PUTs what is on disk, and issues one DELETE
 * per missing slug, so a partial run can never unlist anything.
 */
import { execFileSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { lstat, readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = process.cwd()
const cli = resolve(root, 'dist/cli.js')
const blueprintsDir = resolve(root, 'blueprints')

const args = process.argv.slice(2)

function fail(message) {
  console.error(`error: ${message}`)
  process.exit(1)
}

function showHelp() {
  console.log(`Usage: npm run blueprints:publish -- [options]

Build and publish every Blueprint under blueprints/ to a catalog. Blueprints
present in the catalog but absent locally are withdrawn.

Options:
  --catalog <origin>  Catalog origin (default: BUSINESSLENS_CATALOG_URL or
                      https://businesslens.io)
  --dry-run           Build and show the planned changes without catalog writes
  --yes               Skip the confirmation prompt
  -h, --help          Show this help

Environment:
  BUSINESSLENS_CATALOG_KEY  Required bearer credential
  BUSINESSLENS_CATALOG_URL  Default catalog origin when --catalog is omitted`)
}

if (args.includes('--help') || args.includes('-h')) {
  showHelp()
  process.exit(0)
}

let assumeYes = false
let dryRun = false
let origin = process.env.BUSINESSLENS_CATALOG_URL ?? 'https://businesslens.io'
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--yes') {
    assumeYes = true
  } else if (arg === '--dry-run') {
    dryRun = true
  } else if (arg === '--catalog') {
    const value = args[index + 1]
    if (!value || value.startsWith('-')) fail('--catalog requires an origin.')
    origin = value
    index += 1
  } else {
    fail(`Unknown option "${arg}". Run \`npm run blueprints:publish -- --help\` for usage.`)
  }
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
  const loopback = url.hostname === 'localhost'
    || url.hostname === '::1'
    || url.hostname === '[::1]'
    || /^127(\.\d+){3}$/.test(url.hostname)
  if (url.origin === 'https://businesslens.io') return url.origin
  if (loopback && (url.protocol === 'http:' || url.protocol === 'https:')) return url.origin
  fail('The publisher catalog must be https://businesslens.io or a loopback origin.')
}

const catalog = trustedCatalogOrigin(origin)
const isLoopbackCatalog = /^https?:\/\/(localhost|127(\.\d+){3}|\[?::1\]?)(:\d+)?$/.test(catalog)
const key = process.env.BUSINESSLENS_CATALOG_KEY
if (!key) fail('BUSINESSLENS_CATALOG_KEY is not set.')

const { projectPortableReport } = await import('../dist/report.js')
const { validateProductLogo } = await import('../dist/logo.js')

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
  const logoFile = join(dir, '.businesslens', 'logo.svg')
  if (!existsSync(logoFile)) fail(`blueprints/${slug}: .businesslens/logo.svg is required`)
  const logoStat = await lstat(logoFile)
  if (logoStat.isSymbolicLink() || !logoStat.isFile()) {
    fail(`blueprints/${slug}: .businesslens/logo.svg must be a regular file`)
  }
  const logoIssues = validateProductLogo(await readFile(logoFile))
  if (logoIssues.length) fail(`blueprints/${slug}: ${logoIssues.join('; ')}`)
  try {
    execFileSync(process.execPath, [cli, '--cwd', dir, 'blueprint', 'export'], { stdio: 'pipe' })
  } catch (error) {
    fail(`blueprints/${slug}: build failed — ${(error.stderr || error.message).toString().trim()}`)
  }
  // Project here as well as server-side. The catalog does not trust this
  // client, but workspace material should not travel over the wire.
  const report = projectPortableReport(
    JSON.parse(await readFile(join(dir, '.businesslens/build/report.json'), 'utf8'))
  )
  if (report.id !== slug) fail(`blueprints/${slug}: Product ID "${report.id}" does not match its directory`)
  payloads.push({
    slug,
    report,
    sourceRepository: 'https://github.com/businesslens/pdd',
    sourcePath: `blueprints/${slug}`,
    sourceCommit: commit
  })
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
