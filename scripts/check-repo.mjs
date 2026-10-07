#!/usr/bin/env node
import { readFile, readdir, access } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { changelogProblems } from './changelog.mjs'
import {
  VOCABULARY_MODULE,
  readVocabulary,
  renderModule
} from './vocabulary.mjs'

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
  'README.md', 'LICENSE', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json', 'src/cli.ts',
  'CHANGELOG.md', 'SECURITY.md', 'CONTRIBUTING.md',
  'spec/format.md', 'spec/report.md', 'docs/product-model.md', 'docs/product.md',
  'docs/cli.md', 'docs/cli-view.md',
  'src/logo.ts', 'layers/nuxt/report-viewer/nuxt.config.ts',
  'layers/nuxt/report-viewer-lab/nuxt.config.ts',
  'layers/nuxt/report-viewer/app/components/BusinessLensReportViewer.vue',
  'layers/nuxt/theme/nuxt.config.ts', 'layers/nuxt/theme-lab/nuxt.config.ts',
  'layers/nuxt/theme/app/components/BusinessLensBrand.vue',
  'layers/nuxt/theme/app/composables/useBusinessLensThemeHead.ts',
  'layers/nuxt/theme-lab/app/components/BusinessLensThemeLabBar.vue',
  'viewer/app/package.json',
  'viewer/app/app/pages/index.vue', 'src/core/local-viewer-server.ts',
  '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json'
]
for (const file of REQUIRED) {
  if (!await exists(file)) errors.push(`missing required file: ${file}`)
}

const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const workspace = parseYaml(await readFile(resolve(root, 'pnpm-workspace.yaml'), 'utf8'))
const plugin = JSON.parse(await readFile(resolve(root, '.claude-plugin/plugin.json'), 'utf8'))
const marketplace = JSON.parse(await readFile(resolve(root, '.claude-plugin/marketplace.json'), 'utf8'))
const localViewer = JSON.parse(await readFile(resolve(root, 'viewer/app/package.json'), 'utf8'))
const reportContract = await readFile(resolve(root, 'src/core/portable.ts'), 'utf8')
const reportViewerReadme = await readFile(resolve(root, 'layers/nuxt/report-viewer/README.md'), 'utf8')
const nuxtConsumerFixture = await readFile(resolve(root, 'test/fixtures/nuxt-layer-consumer/app/pages/index.vue'), 'utf8')
const reportViewerEntry = await readFile(
  resolve(root, 'layers/nuxt/report-viewer/app/components/BusinessLensReportViewer.vue'), 'utf8'
)
const reportViewerSections = await readFile(
  resolve(root, 'layers/nuxt/report-viewer/app/utils/pageSections.ts'), 'utf8'
)
const pullCommand = await readFile(resolve(root, 'src/commands/pull.ts'), 'utf8')
const reportSpec = await readFile(resolve(root, 'spec/report.md'), 'utf8')
const pullDoc = await readFile(resolve(root, 'docs/cli-pull.md'), 'utf8')
const expectedSkills = [
  'businesslens-map',
  'businesslens-ideate',
  'businesslens-verify'
]

const reportVersion = reportContract.match(/REPORT_SCHEMA_VERSION = '([^']+)'/)?.[1]
const reportMajor = reportVersion?.split('.')[0]
if (!reportVersion || !reportMajor) {
  errors.push('src/core/portable.ts must declare REPORT_SCHEMA_VERSION')
} else {
  if (!reportViewerReadme.includes(`Product Report v${reportMajor}`)
    || !reportViewerReadme.includes(`ProductReportV${reportMajor}`)) {
    errors.push(`report-viewer README must document Product Report v${reportMajor}`)
  }
  if (!nuxtConsumerFixture.includes(`ProductReportV${reportMajor}`)
    || !nuxtConsumerFixture.includes(`schemaVersion: '${reportVersion}'`)) {
    errors.push(`packed Nuxt consumer must exercise Product Report v${reportMajor}`)
  }
  /*
   * The version travels in the report media type, and the two registers a
   * catalog operator reads are the wire contract and the pull page. A hard-coded
   * major went stale in the CLI once already; pin the prose to the same source.
   */
  const negotiated = `version=${reportMajor}`
  if (!pullCommand.includes('version=${REPORT_MAJOR}') || /version=\d/.test(pullCommand)) {
    errors.push('blueprint pull must derive the accepted report version, never hard-code it')
  }
  for (const [label, source] of [['spec/report.md', reportSpec], ['docs/cli-pull.md', pullDoc]]) {
    if (!source.includes(negotiated)) {
      errors.push(`${label} must document the catalog media type parameter ${negotiated}`)
    }
  }
}

/*
 * The report-viewer README is the only documentation a Nuxt host gets, so the
 * page structure and the bindable models it promises are pinned to the
 * component that actually declares them.
 */
for (const model of [...reportViewerEntry.matchAll(/defineModel<[^>]+>\('([^']+)'/g)].map(match => match[1])) {
  if (!reportViewerReadme.includes(`\`${model}\``)) {
    errors.push(`report-viewer README must document the bindable "${model}" model`)
  }
}
const pageTabUnion = reportViewerSections.match(/export type PageTabId = ([^\n]+)/)?.[1]
if (!pageTabUnion) {
  errors.push('report-viewer must declare the PageTabId union')
} else {
  for (const tab of [...pageTabUnion.matchAll(/'([a-z-]+)'/g)].map(match => match[1])) {
    if (!reportViewerReadme.toLowerCase().includes(tab)) {
      errors.push(`report-viewer README must document the "${tab}" page tab`)
    }
  }
}

if (pkg.name !== 'businesslens') errors.push(`package.json name must be businesslens, found ${pkg.name}`)
if (pkg.repository?.url !== 'git+https://github.com/businesslens/pdd.git') {
  errors.push('package.json repository must be git+https://github.com/businesslens/pdd.git')
}
if (pkg.version !== plugin.version) {
  errors.push(`version mismatch: package.json ${pkg.version} vs plugin.json ${plugin.version}`)
}
/*
 * pnpm is the repository's package manager, pinned exactly so every checkout and
 * CI run resolves the same lockfile the same way. The lockfile records no
 * package versions, so version alignment is checked between the manifests.
 * Corepack may append the release's integrity hash; the pin is exact either way.
 */
if (!/^pnpm@\d+\.\d+\.\d+(\+sha\d+\.[0-9a-f]+)?$/.test(pkg.packageManager ?? '')) {
  errors.push(`package.json packageManager must pin an exact pnpm version, found ${pkg.packageManager}`)
}
if (await exists('package-lock.json') || await exists('npm-shrinkwrap.json')) {
  errors.push('the repository is installed with pnpm; remove npm lockfiles')
}
if (pkg.workspaces || pkg.overrides) {
  errors.push('package.json must not declare npm workspaces or overrides; pnpm-workspace.yaml owns them')
}
if (JSON.stringify(workspace?.packages) !== JSON.stringify(['viewer/app'])) {
  errors.push('pnpm-workspace.yaml packages must include only the private viewer app, not a public viewer package')
}
if (localViewer.version !== pkg.version) {
  errors.push(
    `viewer version mismatch: root ${pkg.version}, local ${localViewer.version}`
  )
}
if (localViewer.private !== true) {
  errors.push('viewer/app must remain private; its static output ships inside businesslens')
}
if (localViewer.dependencies?.['@businesslens/report-viewer']) {
  errors.push('viewer/app must consume root-owned Layers, not @businesslens/report-viewer')
}
if (pkg.exports?.['./nuxt/report-viewer'] !== './layers/nuxt/report-viewer/nuxt.config.ts'
  || pkg.exports?.['./nuxt/theme'] !== './layers/nuxt/theme/nuxt.config.ts'
  || pkg.exports?.['./nuxt/theme-lab'] !== './layers/nuxt/theme-lab/nuxt.config.ts'
  || pkg.exports?.['./theme-lab/variants']?.types !== './dist/businesslensThemeLabVariants.d.ts'
  || pkg.exports?.['./theme-lab/variants']?.default !== './dist/businesslensThemeLabVariants.js'
  || !pkg.exports?.['./logo']) {
  errors.push('businesslens must export its logo contract, background variants, and Nuxt report-viewer/theme/theme-lab Layers')
}
if (pkg.exports?.['./nuxt/report-lab'] || pkg.exports?.['./report/view-model']) {
  errors.push('retired report-lab and lossy report view-model exports must stay removed')
}
if (pkg.exports?.['./nuxt/report-viewer-lab']) {
  errors.push('the private report-viewer-lab must not have a package export')
}
if (!pkg.files?.includes('!layers/nuxt/report-viewer-lab')) {
  errors.push('package.json files must exclude the private report-viewer-lab')
}
if (!pkg.files?.includes('!layers/**/node_modules')) {
  errors.push('package.json files must exclude generated layer node_modules')
}
for (const retired of ['layers/nuxt/report-lab', 'layers/nuxt/workbench-lab', 'src/report-view-model.ts']) {
  if (await exists(retired)) errors.push(`retired report artifact must stay removed: ${retired}`)
}
for (const peer of [
  '@fontsource-variable/archivo',
  '@fontsource-variable/inter',
  '@fontsource/ibm-plex-mono',
  '@iconify-json/lucide',
  '@nuxt/ui',
  'nuxt',
  'tailwindcss',
  'vue'
]) {
  if (!pkg.peerDependencies?.[peer] || !pkg.peerDependenciesMeta?.[peer]?.optional) {
    errors.push(`package.json must declare optional Nuxt Layer peer "${peer}"`)
  }
}
const changelog = await readFile(resolve(root, 'CHANGELOG.md'), 'utf8')
if (!changelog.includes(`## [${pkg.version}]`)) {
  errors.push(`CHANGELOG.md is missing a [${pkg.version}] release heading`)
}
// businesslens.io renders this file as-is, one page per release. A heading
// label without its link definition shows its brackets on GitHub and loses
// them on the site; a release without its contributors and comparison has a
// shorter page than the others.
for (const problem of changelogProblems(changelog)) errors.push(`CHANGELOG.md ${problem}`)
if (plugin.repository !== 'https://github.com/businesslens/pdd') {
  errors.push('plugin.json repository must be https://github.com/businesslens/pdd')
}
if (!marketplace.plugins?.some(entry => entry.name === plugin.name)) {
  errors.push(`marketplace.json does not expose the "${plugin.name}" plugin`)
}
for (const required of ['CHANGELOG.md', 'dist', 'docs', 'layers', 'skills']) {
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

// `spec/format.md` is the contract; the skill reference is the copy agents
// actually read while authoring. It may be terser, but it may not omit a name
// the contract requires — an agent cannot author a key it was never told about.
// This is a presence check over names, never a check of what the prose claims.
//
// `## Anything else` is excluded because the spec uses it to demonstrate that
// an *unrecognized* H2 survives export; it is not a recognized section.
const UNRECOGNIZED_SPEC_SECTIONS = new Set(['Anything else'])
const specSource = await readFile(resolve(root, 'spec/format.md'), 'utf8')
const resourceTable = specSource.match(/\| Resource type \| Compact \|[\s\S]*?\n\n/)?.[0]
if (!resourceTable) {
  errors.push('spec/format.md does not expose the resource type layout table')
} else {
  const specNames = new Map()
  for (const row of resourceTable.matchAll(/^\| ([^|]+) \|/gm)) {
    const kind = row[1].trim()
    if (kind !== 'Resource type' && !kind.startsWith('---')) specNames.set(kind, 'resource type')
  }
  for (const [, example] of specSource.matchAll(/```markdown\n([\s\S]*?)```/g)) {
    for (const heading of example.matchAll(/^## (.+)$/gm)) {
      const section = heading[1].trim()
      if (!UNRECOGNIZED_SPEC_SECTIONS.has(section)) specNames.set(`## ${section}`, 'section')
    }
    const frontmatter = example.match(/^---\n([\s\S]*?)\n---/)
    if (!frontmatter) continue
    for (const key of frontmatter[1].matchAll(/^([a-zA-Z][a-zA-Z0-9]*):/gm)) {
      specNames.set(key[1], 'frontmatter key')
    }
  }
  for (const [name, sort] of specNames) {
    if (!canonicalFormatSource.includes(name)) {
      errors.push(`${canonicalFormatReference} never names the ${sort} "${name}" required by spec/format.md`)
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

// Installed authoring instructions and the parser must name the same folder schema.
const modelSource = await readFile(resolve(root, 'src/core/model.ts'), 'utf8')
const folderSchema = modelSource.match(/export const FOLDER_SCHEMA = (\d+)/)?.[1]
for (const file of ['spec/format.md', ...expectedSkills.map(skill => `skills/${skill}/references/format.md`)]) {
  const source = await readFile(resolve(root, file), 'utf8')
  const declarations = [...source.matchAll(/schema: (\d+)/g)].map(match => match[1])
  if (!folderSchema || !declarations.length || declarations.some(version => version !== folderSchema)) {
    errors.push(`${file} must teach folder schema ${folderSchema}`)
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
const DOC_SECTIONS = new Set(['open-source'])
const DOC_GROUPS = new Set([
  'Get started',
  'Product Model',
  'Skills',
  'CLI'
])
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

// Definitions live in the frontmatter of the page that explains each term.
// Check the generated registry still matches its source, so an edit on a page
// cannot reach the docs site while the report still shows the old line.
const vocabulary = await readVocabulary(root)
errors.push(...vocabulary.errors)
if (!vocabulary.errors.length) {
  const actual = await readFile(resolve(root, VOCABULARY_MODULE), 'utf8').catch(() => null)
  if (actual !== renderModule(vocabulary.terms)) {
    errors.push(`${VOCABULARY_MODULE} is stale; run \`pnpm vocabulary\``)
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
