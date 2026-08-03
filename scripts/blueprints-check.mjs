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
import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { z } from 'zod'

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

const ManifestSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase kebab-case').max(80),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(400),
  category: z.string().min(1).max(60),
  tags: z.array(z.string().min(1)).min(1).max(12),
  icon: z.string().min(1),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a #rrggbb hex color'),
  authors: z.array(z.string().min(1)).min(1),
  license: z.literal('MIT'),
  origin: z
    .object({
      repository: z.string().url(),
      commit: z.string().regex(/^[0-9a-f]{7,40}$/)
    })
    .optional()
}).strict()

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
  const manifestPath = join(dir, 'blueprint.yaml')

  if (!existsSync(manifestPath)) {
    errors.push(`${label}: blueprint.yaml is missing`)
    continue
  }
  if (!existsSync(join(dir, '.businesslens'))) {
    errors.push(`${label}: .businesslens/ is missing`)
    continue
  }

  let manifest
  try {
    manifest = ManifestSchema.parse(parseYaml(await readFile(manifestPath, 'utf8')))
  } catch (error) {
    const detail = error.issues
      ? error.issues.map(issue => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ')
      : error.message
    errors.push(`${label}/blueprint.yaml: ${detail}`)
    continue
  }

  if (manifest.slug !== slug) {
    errors.push(`${label}/blueprint.yaml: slug "${manifest.slug}" does not match its directory`)
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

  const leaked = workspaceMaterial(report)
  for (const item of leaked) errors.push(`${label}: carries workspace material — ${item}`)
}

if (errors.length > 0) {
  for (const error of errors) console.error(`error: ${error}`)
  console.error(`\nBlueprint checks failed with ${errors.length} error(s).`)
  process.exit(1)
}

console.log(`Blueprint checks passed (${entries.length} Blueprint${entries.length === 1 ? '' : 's'}).`)
