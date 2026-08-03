#!/usr/bin/env node
import { readFile, readdir, access } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

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
  'README.md', 'LICENSE', 'package.json', 'package-lock.json', 'tsconfig.json', 'src/cli.ts',
  'CHANGELOG.md', 'SECURITY.md', 'CONTRIBUTING.md',
  'spec/format.md', 'docs/product-model.md', 'docs/product.md',
  'docs/cli.md', 'docs/ci.md', 'docs/integration.md',
  '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json'
]
for (const file of REQUIRED) {
  if (!await exists(file)) errors.push(`missing required file: ${file}`)
}

const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'))
const plugin = JSON.parse(await readFile(resolve(root, '.claude-plugin/plugin.json'), 'utf8'))
const marketplace = JSON.parse(await readFile(resolve(root, '.claude-plugin/marketplace.json'), 'utf8'))
const expectedSkills = [
  'businesslens-map',
  'businesslens-ideate',
  'businesslens-verify'
]

if (pkg.name !== 'businesslens') errors.push(`package.json name must be businesslens, found ${pkg.name}`)
if (pkg.repository?.url !== 'git+https://github.com/businesslens/pdd.git') {
  errors.push('package.json repository must be git+https://github.com/businesslens/pdd.git')
}
if (pkg.version !== plugin.version) {
  errors.push(`version mismatch: package.json ${pkg.version} vs plugin.json ${plugin.version}`)
}
if (pkg.version !== lock.version || pkg.version !== lock.packages?.['']?.version) {
  errors.push(
    `version mismatch: package.json ${pkg.version} vs package-lock.json `
    + `${lock.version}/${lock.packages?.['']?.version}`
  )
}
const changelog = await readFile(resolve(root, 'CHANGELOG.md'), 'utf8')
if (!changelog.includes(`## [${pkg.version}]`)) {
  errors.push(`CHANGELOG.md is missing a [${pkg.version}] release heading`)
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

// The model shape contract and isolated runner are duplicated because every
// installed skill must remain self-contained. Keep those common copies exact;
// workflow-specific format guidance may follow the shared contract.
const canonicalFormatReference = 'skills/businesslens-map/references/format.md'
const canonicalFormatSource = await readFile(resolve(root, canonicalFormatReference), 'utf8')
const formatContractPattern = /^# Product Model format\n[\s\S]*?^`\.gitignore` contains `build\/` and `cache\/`\.$/m
const canonicalFormatContract = canonicalFormatSource.match(formatContractPattern)?.[0]
if (!canonicalFormatContract) {
  errors.push(`${canonicalFormatReference} does not expose the shared model format contract`)
} else {
  for (const skill of expectedSkills) {
    const reference = `skills/${skill}/references/format.md`
    const source = await readFile(resolve(root, reference), 'utf8')
    const contract = source.match(formatContractPattern)?.[0]
    if (contract !== canonicalFormatContract) {
      errors.push(`${reference} must embed the shared model format contract exactly`)
    }
  }
}

const canonicalRunner = 'skills/businesslens-map/scripts/run-businesslens.mjs'
const canonicalRunnerSource = await readFile(resolve(root, canonicalRunner), 'utf8')
for (const skill of expectedSkills) {
  const runner = `skills/${skill}/scripts/run-businesslens.mjs`
  const source = await readFile(resolve(root, runner), 'utf8')
  if (source !== canonicalRunnerSource) {
    errors.push(`${runner} must match the canonical isolated runner ${canonicalRunner}`)
  }
}

// Every workflow that can create a model carries the same orientation text.
// Skills are installed independently, so their copies must be self-contained;
// this check prevents those necessary copies from drifting from the CLI writer.
const modelReadmeSource = await readFile(resolve(root, 'src/core/model-readme.ts'), 'utf8')
const modelReadmeMatch = modelReadmeSource.match(/export const MODEL_README = `((?:\\`|[^`])*)`\n/)
if (!modelReadmeMatch) {
  errors.push('src/core/model-readme.ts does not expose the canonical MODEL_README template')
} else {
  const canonicalReadme = modelReadmeMatch[1].replaceAll('\\`', '`')
  for (const skill of expectedSkills) {
    const reference = `skills/${skill}/references/format.md`
    const source = await readFile(resolve(root, reference), 'utf8')
    const fenced = source.match(/## Canonical `.businesslens\/README.md`[\s\S]*?```markdown\n([\s\S]*?)```/)
    if (!fenced || fenced[1] !== canonicalReadme) {
      errors.push(`${reference} must embed the canonical MODEL_README template exactly`)
    }
  }
}

// Docs frontmatter contract, consumed by the landing repository's nav:
// section = top-level tab, group = sidebar cluster, order = global within section.
const DOC_SECTIONS = new Set(['open-source', 'platform'])
const DOC_GROUPS = new Set(['Get started', 'Product model', 'Integration', 'Skills', 'CLI'])
const docFiles = (await readdir(resolve(root, 'docs'))).filter(name => name.endsWith('.md')).sort()
const docOrders = new Map()
for (const name of docFiles) {
  const source = await readFile(resolve(root, `docs/${name}`), 'utf8')
  const match = source.match(/^---\n([\s\S]*?)\n---/)
  if (!match) {
    errors.push(`docs/${name} is missing frontmatter`)
    continue
  }
  let data
  try {
    data = parseYaml(match[1])
  } catch (error) {
    errors.push(`docs/${name} frontmatter is invalid YAML (${error.message})`)
    continue
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push(`docs/${name} frontmatter must be a YAML mapping`)
    continue
  }
  for (const key of ['title', 'description', 'section', 'group']) {
    if (typeof data[key] !== 'string' || !data[key].trim()) {
      errors.push(`docs/${name} frontmatter is missing "${key}"`)
    }
  }
  const section = data.section
  if (section && !DOC_SECTIONS.has(section)) {
    errors.push(`docs/${name} section "${section}" must be one of: ${[...DOC_SECTIONS].join('|')}`)
  }
  const group = data.group
  if (group && !DOC_GROUPS.has(group)) {
    errors.push(`docs/${name} group "${group}" must be one of: ${[...DOC_GROUPS].join('|')}`)
  }
  const order = data.order
  if (!Number.isInteger(order) || order < 1) {
    errors.push(`docs/${name} order must be a positive integer`)
  } else if (DOC_SECTIONS.has(section)) {
    const key = `${section}:${order}`
    const previous = docOrders.get(key)
    if (previous) {
      errors.push(`docs/${name} order ${order} duplicates docs/${previous} in section "${section}"`)
    } else {
      docOrders.set(key, name)
    }
  }
}

for (const section of DOC_SECTIONS) {
  const orders = [...docOrders.keys()]
    .filter(key => key.startsWith(`${section}:`))
    .map(key => Number(key.slice(section.length + 1)))
    .sort((left, right) => left - right)
  if (!orders.length) continue
  const expected = orders.map((_, index) => index + 1)
  if (orders.some((order, index) => order !== expected[index])) {
    errors.push(
      `docs section "${section}" orders must be contiguous from 1; found ${orders.join(', ')}`
    )
  }
}

for (const file of ['README.md', ...docFiles.map(name => `docs/${name}`)]) {
  const source = await readFile(resolve(root, file), 'utf8')
  for (const match of source.matchAll(/\[[^\]]*]\(([^)]+)\)/g)) {
    const rawHref = match[1].trim().replace(/^<|>$/g, '')
    const href = rawHref.split(/\s+["']/)[0].split(/[?#]/)[0]
    if (!href || href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue
    const target = resolve(root, dirname(file), href)
    if (!await exists(target)) {
      const line = source.slice(0, match.index).split('\n').length
      errors.push(`${file}:${line} links to missing local file "${href}"`)
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`)
  process.exit(1)
}
console.log('Repository checks passed.')
