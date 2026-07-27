#!/usr/bin/env node
import { readFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const errors = []

async function exists(path) {
  try {
    await access(resolve(root, path))
    return true
  } catch {
    return false
  }
}

const REQUIRED = [
  'README.md', 'LICENSE', 'package.json', 'tsconfig.json', 'src/cli.ts',
  'CHANGELOG.md', 'SECURITY.md', 'CONTRIBUTING.md',
  'docs/format.md', 'docs/cli.md', 'docs/ci.md', 'docs/pdd-and-sdd.md',
  '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json'
]
for (const file of REQUIRED) {
  if (!await exists(file)) errors.push(`missing required file: ${file}`)
}

const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const plugin = JSON.parse(await readFile(resolve(root, '.claude-plugin/plugin.json'), 'utf8'))
const marketplace = JSON.parse(await readFile(resolve(root, '.claude-plugin/marketplace.json'), 'utf8'))
const expectedSkills = [
  'businesslens-init',
  'businesslens-sync',
  'businesslens-deep-dive',
  'businesslens-validate',
  'businesslens-doctor',
  'businesslens-publish'
]

if (pkg.name !== 'businesslens') errors.push(`package.json name must be businesslens, found ${pkg.name}`)
if (pkg.repository?.url !== 'git+https://github.com/businesslens/pdd.git') {
  errors.push('package.json repository must be git+https://github.com/businesslens/pdd.git')
}
if (pkg.version !== plugin.version) {
  errors.push(`version mismatch: package.json ${pkg.version} vs plugin.json ${plugin.version}`)
}
if (plugin.repository !== 'https://github.com/businesslens/pdd') {
  errors.push('plugin.json repository must be https://github.com/businesslens/pdd')
}
if (!marketplace.plugins?.some(entry => entry.name === plugin.name)) {
  errors.push(`marketplace.json does not expose the "${plugin.name}" plugin`)
}
for (const required of ['CHANGELOG.md', 'dist', 'docs', 'skills']) {
  if (!pkg.files?.includes(required)) errors.push(`package.json files must include "${required}"`)
}
if (plugin.commands?.length) {
  errors.push('plugin.json must not expose legacy commands; workflows are separate skills')
}

const configuredSkills = (plugin.skills || []).map(path => path.replace(/^\.\//, '').split('/').at(-1))
for (const skill of expectedSkills) {
  if (!configuredSkills.includes(skill)) errors.push(`plugin.json is missing skill "${skill}"`)
}
for (const skill of configuredSkills) {
  if (!expectedSkills.includes(skill)) errors.push(`plugin.json has unexpected skill "${skill}"`)
}

for (const skillPath of plugin.skills || []) {
  const dir = skillPath.replace(/^\.\//, '')
  const skillFile = `${dir}/SKILL.md`
  if (!await exists(skillFile)) {
    errors.push(`${skillFile} is missing for plugin skill ${skillPath}`)
    continue
  }
  const source = await readFile(resolve(root, skillFile), 'utf8')
  const match = source.match(/^---\n([\s\S]*?)\n---/)
  if (!match) {
    errors.push(`${skillFile} is missing frontmatter`)
    continue
  }
  const keys = match[1].split('\n').filter(line => /^[a-z]+:/i.test(line)).map(line => line.split(':')[0])
  const allowed = new Set(['name', 'description'])
  for (const key of keys) {
    if (!allowed.has(key)) errors.push(`${skillFile} frontmatter has unexpected key "${key}"`)
  }
  const name = match[1].match(/^name:\s*(.+)$/m)?.[1]?.trim()
  const dirName = dir.split('/').at(-1)
  if (name !== dirName) errors.push(`${skillFile} frontmatter name "${name}" must match directory "${dirName}"`)
  if (!name?.startsWith('businesslens-')) {
    errors.push(`${skillFile} name must start with "businesslens-"`)
  }
  if (!await exists(`${dir}/agents/openai.yaml`)) {
    errors.push(`${dir}/agents/openai.yaml is missing`)
  }
}

if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`)
  process.exit(1)
}
console.log('Repository checks passed.')
