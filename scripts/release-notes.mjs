#!/usr/bin/env node

// Print one release's CHANGELOG.md section as GitHub Release notes.
//
//   node scripts/release-notes.mjs <version>

import { readFile } from 'node:fs/promises'
import { releaseNotes } from './changelog.mjs'

const version = process.argv[2]
if (!version) {
  console.error('Usage: node scripts/release-notes.mjs <version>')
  process.exit(2)
}
const markdown = await readFile(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
process.stdout.write(`${releaseNotes(markdown, version)}\n`)
