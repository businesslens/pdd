#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

function fail(message) {
  process.stderr.write(`${message}\n`)
  process.exit(1)
}

function git(root, ...args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
}

function matches(files, pattern) {
  return files.filter(file => pattern.test(file)).sort()
}

const args = process.argv.slice(2)
const rootIndex = args.indexOf('--root')
const requestedRoot = rootIndex >= 0 ? args[rootIndex + 1] : process.cwd()
if (!requestedRoot) fail('--root requires a directory')

let root
try {
  root = resolve(git(resolve(requestedRoot), 'rev-parse', '--show-toplevel').trim())
} catch {
  fail('BusinessLens inventory must run inside a Git repository.')
}

const files = git(root, 'ls-files', '-z').split('\0').filter(Boolean)
const extensions = {}
const topLevel = {}
for (const file of files) {
  const extension = extname(file).toLowerCase() || '[none]'
  extensions[extension] = (extensions[extension] || 0) + 1
  const area = file.includes('/') ? file.split('/')[0] : '[root]'
  topLevel[area] = (topLevel[area] || 0) + 1
}

const inventory = {
  inventoriedAt: new Date().toISOString(),
  repositoryRoot: root,
  trackedFileCount: files.length,
  extensions: Object.fromEntries(Object.entries(extensions).sort((left, right) => right[1] - left[1])),
  topLevelAreas: Object.fromEntries(Object.entries(topLevel).sort((left, right) => right[1] - left[1])),
  candidates: {
    instructions: matches(files, /(^|\/)(AGENTS|CLAUDE|CONTRIBUTING|README|SECURITY)(\.|$)/i),
    documentation: matches(files, /(^|\/)(docs?|documentation)\//i),
    entryPoints: matches(files, /(routes?|router|controllers?|handlers?|commands?|cmd|api|graphql|http|ssh|web)\b/i),
    processes: matches(files, /(queues?|workers?|jobs?|tasks?|schedulers?|cron|webhooks?|indexers?|services?|daemons?)\b/i),
    persistence: matches(files, /(models?|entities|schemas?|migrations?|database|storage|repositories)\b/i),
    observability: matches(files, /(metrics?|telemetry|tracing|logging|audit|monitoring|prometheus|opentelemetry)\b/i),
    configuration: matches(files, /(^|\/)(config|configs|configuration|settings|\.env|docker|helm|charts?)\b/i),
    tests: matches(files, /(^|\/)(tests?|specs?|e2e|fixtures?)\//i)
  },
  files: [...files].sort()
}

const output = `${JSON.stringify(inventory, null, 2)}\n`
if (args.includes('--write')) {
  const cache = join(root, '.businesslens', 'cache')
  mkdirSync(cache, { recursive: true })
  writeFileSync(join(cache, 'inventory.json'), output)
}
process.stdout.write(output)
