#!/usr/bin/env node

import { readdir, stat } from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = process.cwd()

async function bytes(path) {
  const entry = await stat(path)
  if (entry.isFile()) return entry.size
  const children = await readdir(path, { withFileTypes: true })
  return (await Promise.all(children.map(child => bytes(resolve(path, child.name)))))
    .reduce((total, size) => total + size, 0)
}

const budgets = [
  { path: 'dist/viewer', label: 'bundled local viewer', maximum: 5 * 1024 * 1024 },
  // The stable theme packages the approved identity and icon family. The
  // report-viewer also owns the Product Report and named topology engine.
  { path: 'layers/nuxt', label: 'Nuxt Layer source', maximum: 1500 * 1024 }
]

let failed = false
for (const budget of budgets) {
  const size = await bytes(resolve(root, budget.path))
  const kibibytes = Math.ceil(size / 1024)
  const maximumKibibytes = budget.maximum / 1024
  console.log(`${budget.label}: ${kibibytes} KiB / ${maximumKibibytes} KiB`)
  if (size > budget.maximum) {
    console.error(`error: ${budget.label} exceeds its ${maximumKibibytes} KiB budget`)
    failed = true
  }
}

// Check the compressed artifact here as well as in Publish. Coverage, sidebar
// and matrix UI fit within this shared archive budget.
const maximumTarballBytes = 2240 * 1024
const tarballBytes = process.argv[2]
  ? (await stat(resolve(process.argv[2]))).size
  : JSON.parse(execSync('npm pack --dry-run --ignore-scripts --json', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))[0].size
console.log(`package tarball: ${Math.ceil(tarballBytes / 1024)} KiB / ${maximumTarballBytes / 1024} KiB`)
if (tarballBytes > maximumTarballBytes) {
  console.error('error: package tarball exceeds its compressed size budget')
  failed = true
}

if (failed) process.exit(1)
