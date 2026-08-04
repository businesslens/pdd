#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'

const packageFile = new URL('../package.json', import.meta.url)
const pluginFile = new URL('../.claude-plugin/plugin.json', import.meta.url)
const lockFile = new URL('../package-lock.json', import.meta.url)
const localViewerFile = new URL('../viewer/app/package.json', import.meta.url)

const pkg = JSON.parse(await readFile(packageFile, 'utf8'))
const plugin = JSON.parse(await readFile(pluginFile, 'utf8'))
const lock = JSON.parse(await readFile(lockFile, 'utf8'))
const localViewer = JSON.parse(await readFile(localViewerFile, 'utf8'))

if (typeof pkg.version !== 'string' || !pkg.version) {
  throw new Error('package.json does not contain a valid version')
}

plugin.version = pkg.version
localViewer.version = pkg.version
lock.version = pkg.version
lock.packages[''].version = pkg.version
lock.packages['viewer/app'].version = pkg.version

await Promise.all([
  writeFile(pluginFile, `${JSON.stringify(plugin, null, 2)}\n`),
  writeFile(lockFile, `${JSON.stringify(lock, null, 2)}\n`),
  writeFile(localViewerFile, `${JSON.stringify(localViewer, null, 2)}\n`)
])
console.log(`Synchronized plugin and private viewer versions to ${pkg.version}.`)
