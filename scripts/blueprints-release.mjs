#!/usr/bin/env node
/**
 * Build every Blueprint under `blueprints/` into the files of the rolling
 * Blueprint release: one report per Blueprint, its logo and optional cover,
 * and the `index.json` that `blueprint list` and `blueprint pull` read.
 *
 * CI runs this on every push to `main` and uploads the result to the
 * `blueprints-v<report major>` GitHub Release, so a merged Blueprint can be
 * pulled without a CLI release. Merging a contribution is what approves it.
 *
 * Everything is built before anything is written, so a broken checkout cannot
 * produce a release that drops a Blueprint.
 */
import { execFileSync } from 'node:child_process'
import { copyFile, lstat, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
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

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: pnpm blueprints:release <out-dir>

Build every Blueprint under blueprints/ into <out-dir>: <slug>.json,
<slug>.logo.svg, an optional <slug>.cover.webp, and index.json. The directory
must not exist yet or be empty. CI uploads it to the Blueprint release.`)
  process.exit(0)
}

if (args.length !== 1 || args[0].startsWith('-')) {
  fail('Pass exactly one output directory. Run `pnpm blueprints:release --help` for usage.')
}
const outDir = resolve(root, args[0])
if (existsSync(outDir) && (await readdir(outDir)).length) fail(`${args[0]} is not empty.`)
if (!existsSync(cli)) fail('dist/cli.js is missing. Run `pnpm build:core` first.')

const { projectPortableReport, REPORT_SCHEMA_VERSION } = await import('../dist/report.js')
const { reportDigest } = await import('../dist/report-digest.js')
const { validateProductCover, validateProductLogo } = await import('../dist/logo.js')

const reportVersion = REPORT_SCHEMA_VERSION.split('.')[0]
const commit = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

if (!existsSync(blueprintsDir)) fail('No blueprints/ directory.')
const slugs = (await readdir(blueprintsDir, { withFileTypes: true }))
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort()

/** A regular file, never a link; undefined when absent and `optional`. */
async function regularFile(file, label, optional) {
  // lstat rather than existsSync, which follows links: a broken link is refused, not skipped.
  const stat = await lstat(file).catch(error => (error.code === 'ENOENT' ? undefined : Promise.reject(error)))
  if (!stat) {
    if (optional) return undefined
    fail(`${label} is required`)
  }
  if (stat.isSymbolicLink() || !stat.isFile()) fail(`${label} must be a regular file`)
  return readFile(file)
}

const built = []
for (const slug of slugs) {
  const dir = join(blueprintsDir, slug)
  const productDir = join(dir, '.businesslens', 'product')
  const logo = await regularFile(join(productDir, 'logo.svg'), `blueprints/${slug}: .businesslens/product/logo.svg`, false)
  const logoIssues = validateProductLogo(logo)
  if (logoIssues.length) fail(`blueprints/${slug}: ${logoIssues.join('; ')}`)
  const cover = await regularFile(join(productDir, 'cover.webp'), `blueprints/${slug}: .businesslens/product/cover.webp`, true)
  if (cover) {
    const coverIssues = validateProductCover(cover)
    if (coverIssues.length) fail(`blueprints/${slug}: ${coverIssues.join('; ')}`)
  }
  try {
    execFileSync(process.execPath, [cli, '--cwd', dir, 'blueprint', 'export'], { stdio: 'pipe' })
  } catch (error) {
    fail(`blueprints/${slug}: build failed — ${(error.stderr || error.message).toString().trim()}`)
  }
  // `export` already writes the portable profile; projecting again is idempotent
  // and keeps workspace material out of a public download whatever export did.
  const report = projectPortableReport(
    JSON.parse(await readFile(join(dir, '.businesslens/build/report.json'), 'utf8'))
  )
  if (report.id !== slug) fail(`blueprints/${slug}: Product ID "${report.id}" does not match its directory`)
  built.push({ slug, report, logo, cover })
  console.log(`built  ${slug}`)
}

await mkdir(outDir, { recursive: true })
const blueprints = []
for (const { slug, report, logo, cover } of built) {
  const entry = {
    slug,
    title: report.title,
    summary: report.summary,
    report: `${slug}.json`,
    digest: reportDigest(report),
    logo: `${slug}.logo.svg`,
    cover: cover ? `${slug}.cover.webp` : null
  }
  await writeFile(join(outDir, entry.report), `${JSON.stringify(report)}\n`)
  await writeFile(join(outDir, entry.logo), logo)
  if (cover) await copyFile(join(blueprintsDir, slug, '.businesslens/product/cover.webp'), join(outDir, entry.cover))
  blueprints.push(entry)
}
await writeFile(
  join(outDir, 'index.json'),
  `${JSON.stringify({ reportVersion, commit, blueprints }, null, 2)}\n`
)

console.log(`\nrelease blueprints-v${reportVersion}`)
console.log(`commit  ${commit.slice(0, 12)}`)
console.log(`wrote   ${blueprints.length} Blueprints to ${args[0]}`)
