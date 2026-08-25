#!/usr/bin/env node

import { readdir, stat } from 'node:fs/promises'
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

if (failed) process.exit(1)
