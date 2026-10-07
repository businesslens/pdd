#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'

const packageFile = new URL('../package.json', import.meta.url)
const pluginFile = new URL('../.claude-plugin/plugin.json', import.meta.url)
const localViewerFile = new URL('../viewer/app/package.json', import.meta.url)

const pkg = JSON.parse(await readFile(packageFile, 'utf8'))
const plugin = JSON.parse(await readFile(pluginFile, 'utf8'))
const localViewer = JSON.parse(await readFile(localViewerFile, 'utf8'))

if (typeof pkg.version !== 'string' || !pkg.version) {
  throw new Error('package.json does not contain a valid version')
}

// pnpm-lock.yaml records no workspace versions, so the manifests are the
// whole set to keep aligned.
plugin.version = pkg.version
localViewer.version = pkg.version

await Promise.all([
  writeFile(pluginFile, `${JSON.stringify(plugin, null, 2)}\n`),
  writeFile(localViewerFile, `${JSON.stringify(localViewer, null, 2)}\n`)
])
console.log(`Synchronized plugin and private viewer versions to ${pkg.version}.`)
