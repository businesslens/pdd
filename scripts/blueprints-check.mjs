#!/usr/bin/env node
/**
 * Gate every Blueprint under `blueprints/` before it can reach the catalog.
 *
 * This deliberately does not trust `businesslens blueprint contribute`.
 * Anyone can open a pull request by hand, so the checks that matter — above all
 * that no Blueprint carries workspace material out of the repository it was
 * authored in — are re-run here against what is actually on disk.
 */
import { execFileSync } from 'node:child_process'
import { lstat, readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { validateBlueprintReport } from '../dist/report.js'
import { validateProductLogo } from '../dist/logo.js'

const root = process.cwd()
const cli = resolve(root, 'dist/cli.js')

/** Compile a Blueprint through the real CLI and return its Product Report. */
async function buildBlueprint(dir) {
  try {
    execFileSync(process.execPath, [cli, '--cwd', dir, 'blueprint', 'export'], { stdio: 'pipe', encoding: 'utf8' })
  } catch (error) {
    throw new Error((error.stderr || error.stdout || error.message).trim())
  }
  return JSON.parse(await readFile(join(dir, '.businesslens/build/report.json'), 'utf8'))
}
const blueprintsDir = resolve(root, 'blueprints')
const errors = []

if (!existsSync(blueprintsDir)) {
  console.log('No blueprints/ directory — nothing to check.')
  process.exit(0)
}

const entries = (await readdir(blueprintsDir, { withFileTypes: true }))
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort()

if (entries.length === 0) errors.push('blueprints/: no Blueprints found')
if (!existsSync(join(blueprintsDir, 'LICENSE'))) {
  errors.push('blueprints/LICENSE is missing — Blueprint content must state its license')
}

/** Every place a Blueprint could carry workspace-only material. */
function workspaceMaterial(report) {
  const found = []
  if (report.referenceProfile !== 'portable') {
    found.push(`referenceProfile is ${JSON.stringify(report.referenceProfile)}`)
  }
  const hosts = [{ id: 'product', references: report.references ?? [] }]
  for (const [kind, items] of Object.entries(report.model)) {
    if (!Array.isArray(items)) continue
    for (const item of items) {
      if (item.references) hosts.push({ id: `${kind}/${item.id}`, references: item.references })
    }
  }
  for (const host of hosts) {
    for (const reference of host.references) {
      if (
        reference.kind === 'code'
        || reference.role === 'implementation'
        || !/^https?:\/\//i.test(reference.target)
      ) found.push(`${host.id}: non-portable reference ${JSON.stringify(reference)}`)
    }
  }
  if (report.coverage?.sourceAreas?.length) {
    found.push(`coverage.sourceAreas ${JSON.stringify(report.coverage.sourceAreas)}`)
  }
  if (report.repository?.link) found.push(`repository.link ${report.repository.link}`)
  if (report.repository?.entryPoint) found.push(`repository.entryPoint ${report.repository.entryPoint}`)
  return found
}

for (const slug of entries) {
  const dir = join(blueprintsDir, slug)
  const label = `blueprints/${slug}`
  if (!existsSync(join(dir, '.businesslens'))) {
    errors.push(`${label}: .businesslens/ is missing`)
    continue
  }
  const logoFile = join(dir, '.businesslens', 'logo.svg')
  if (!existsSync(logoFile)) {
    errors.push(`${label}: .businesslens/logo.svg is required`)
  } else {
    const stat = await lstat(logoFile)
    if (stat.isSymbolicLink() || !stat.isFile()) {
      errors.push(`${label}: .businesslens/logo.svg must be a regular file, not a symbolic link`)
    } else {
      for (const issue of validateProductLogo(await readFile(logoFile))) {
        errors.push(`${label}: ${issue}`)
      }
    }
  }

  // Build rather than validate alone: a Blueprint that cannot compile into a
  // Product Report cannot be published, and building is what validates it.
  let report
  try {
    report = await buildBlueprint(dir)
  } catch (error) {
    errors.push(`${label}: ${error.message}`)
    continue
  }

  if (report.id !== slug) {
    errors.push(`${label}: Product ID "${report.id}" does not match its directory`)
  }
  for (const issue of validateBlueprintReport(report)) {
    errors.push(`${label}: ${issue}`)
  }

  const leaked = workspaceMaterial(report)
  for (const item of leaked) errors.push(`${label}: carries workspace material — ${item}`)
}

if (errors.length > 0) {
  for (const error of errors) console.error(`error: ${error}`)
  console.error(`\nBlueprint checks failed with ${errors.length} error(s).`)
  process.exit(1)
}

console.log(`Blueprint checks passed (${entries.length} Blueprint${entries.length === 1 ? '' : 's'}).`)
