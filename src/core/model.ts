import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import type { Availability, CompactEntryPoint, EntityReference } from './frontmatter.js'
import type { MarkdownDoc } from './markdown.js'
import {
  availabilityField,
  entryPointsField,
  referencesField,
  rejectUnknownKeys,
  splitFrontmatter,
  stringField,
  stringListField,
  uniqueStringListField
} from './frontmatter.js'
import { stem } from './ids.js'
import { readProductLogo } from './logo-file.js'
import {
  bulletList, containsStructuralHeading, decisionPoints, orderedList, parseMarkdown, screenStates, section
} from './markdown.js'

export interface EntityFile {
  id: string
  file: string
  doc: MarkdownDoc
  references: EntityReference[]
}

export interface ActorEntity extends EntityFile {
  kind: string
  relationship: string
}

export interface InterfaceEntity extends EntityFile {
  actors: string[]
  entryPoints: CompactEntryPoint[]
  capabilityBoundary: string
}

export interface ExperienceEntity extends EntityFile {
  actors: string[]
  interfaces: string[]
  access: string
  entryPoints: CompactEntryPoint[]
  capabilityBoundary: string
}

export interface DomainEntity extends EntityFile {
  colorSlot?: number
}

export interface CapabilityEntity extends EntityFile {
  domain?: string
  availability: Availability[]
}

export interface ScreenEntity extends EntityFile {
  availability: Availability[]
  capabilities: string[]
  capabilityScenarios: string[]
  journeyScenarios: string[]
  entryPoints: CompactEntryPoint[]
  information: string[]
  actions: string[]
  states: ReturnType<typeof screenStates>
  capabilityBoundary: string
}

interface ScenarioEntity extends EntityFile {
  kind: string
  actors: string[]
  trigger: string
  steps: string[]
  outcome: string
  edgeCases: string[]
  decisionPoints: ReturnType<typeof decisionPoints>
}

export interface CapabilityScenarioEntity extends ScenarioEntity {
  capability: string
  availability: Availability[]
}

export interface JourneyFlowItem {
  id: string
  capability: string
  operation: string
}

export interface ExactContext {
  interface: string
  experience?: string
}

export interface JourneyRouteContext extends ExactContext {
  stage: string
}

export interface JourneyRoute {
  id: string
  contexts: JourneyRouteContext[]
}

export interface JourneyScenarioEntity extends ScenarioEntity {
  journey: string
  result: string
  flow: JourneyFlowItem[]
  routes: JourneyRoute[]
}

export interface JourneyEntity extends EntityFile {
  actors: string[]
  goal: string
  successCriterion: string
}

export interface BusinessRuleEntity extends EntityFile {
  appliesTo: BusinessRuleTarget[]
  rationale: string
}

export type BusinessRuleEntityTargetType =
  | 'capability'
  | 'capability-scenario'
  | 'journey'
  | 'journey-scenario'

export interface BusinessRuleEntityTarget {
  type: BusinessRuleEntityTargetType
  id: string
  contexts: ExactContext[]
}

export interface BusinessRuleContextTarget extends ExactContext {
  type: 'context'
}

export type BusinessRuleTarget = BusinessRuleEntityTarget | BusinessRuleContextTarget

export interface ScenarioKind {
  id: string
  name: string
  description: string
  colorSlot?: number
}

export interface ProductAuthor {
  name: string
  url?: string
}

export interface PddModel {
  root: string
  config: { schema: number, sddPaths: string[] }
  product: {
    id: string
    summary?: string
    category?: string
    tags: string[]
    authors: ProductAuthor[]
    license?: string
    limitations: string[]
    doc: MarkdownDoc
    references: EntityReference[]
  }
  scenarioKinds: ScenarioKind[]
  coverage: {
    status: string
    method: string[]
    sourceAreas: string[]
    unmapped: string[]
    limitations: string[]
    rationale: string
  }
  actors: ActorEntity[]
  interfaces: InterfaceEntity[]
  experiences: ExperienceEntity[]
  screens: ScreenEntity[]
  domains: DomainEntity[]
  capabilities: CapabilityEntity[]
  capabilityScenarios: CapabilityScenarioEntity[]
  businessRules: BusinessRuleEntity[]
  journeys: JourneyEntity[]
  journeyScenarios: JourneyScenarioEntity[]
  issues: string[]
}

export const FOLDER = '.businesslens'

function listMarkdown(directory: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory).filter(name => name.endsWith('.md')).sort()
}

function readEntity(
  file: string,
  allowedKeys: string[],
  issues: string[]
): { data: Record<string, unknown>, doc: MarkdownDoc, references: EntityReference[] } {
  const source = readFileSync(file, 'utf8')
  const { data, body } = splitFrontmatter(source, issues, file)
  rejectUnknownKeys(data, [...allowedKeys, 'references'], issues, file)
  const doc = parseMarkdown(body)
  return { data, doc, references: referencesField(data, issues, file) }
}

function readScenarioSections(doc: MarkdownDoc, issues: string[], file: string) {
  return {
    trigger: section(doc, 'Trigger') || '',
    steps: orderedList(section(doc, 'Steps') || ''),
    outcome: section(doc, 'Outcome') || '',
    edgeCases: bulletList(section(doc, 'Edge cases') || ''),
    decisionPoints: decisionPoints(section(doc, 'Decision points') || '', issues, file)
  }
}

function journeyFlowField(
  data: Record<string, unknown>,
  issues: string[],
  label: string
): JourneyFlowItem[] {
  const value = data.flow
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    issues.push(`${label}: "flow" must be a list`)
    return []
  }
  const flow: JourneyFlowItem[] = []
  for (const [index, raw] of value.entries()) {
    const itemLabel = `${label}: flow item ${index + 1}`
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      issues.push(`${itemLabel} must be a mapping`)
      continue
    }
    const item = raw as Record<string, unknown>
    rejectUnknownKeys(item, ['id', 'capability', 'operation'], issues, itemLabel)
    flow.push({
      id: stringField(item, 'id', issues, itemLabel) || '',
      capability: stringField(item, 'capability', issues, itemLabel) || '',
      operation: stringField(item, 'operation', issues, itemLabel) || ''
    })
  }
  return flow
}

function exactContextField(
  raw: unknown,
  issues: string[],
  label: string,
  allowedExtra: string[] = []
): ExactContext | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    issues.push(`${label}: context must be a mapping`)
    return undefined
  }
  const item = raw as Record<string, unknown>
  rejectUnknownKeys(item, ['interface', 'experience', ...allowedExtra], issues, label)
  const interfaceId = stringField(item, 'interface', issues, label) || ''
  const experience = stringField(item, 'experience', issues, label)
  return { interface: interfaceId, ...(experience ? { experience } : {}) }
}

function journeyRoutesField(
  data: Record<string, unknown>,
  issues: string[],
  label: string
): JourneyRoute[] {
  const value = data.routes
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    issues.push(`${label}: "routes" must be a list`)
    return []
  }
  const routes: JourneyRoute[] = []
  for (const [routeIndex, rawRoute] of value.entries()) {
    const routeLabel = `${label}: route ${routeIndex + 1}`
    if (typeof rawRoute !== 'object' || rawRoute === null || Array.isArray(rawRoute)) {
      issues.push(`${routeLabel} must be a mapping`)
      continue
    }
    const route = rawRoute as Record<string, unknown>
    rejectUnknownKeys(route, ['id', 'contexts'], issues, routeLabel)
    const rawContexts = route.contexts
    const contexts: JourneyRouteContext[] = []
    if (!Array.isArray(rawContexts)) {
      issues.push(`${routeLabel}: "contexts" must be a list`)
    } else {
      for (const [contextIndex, rawContext] of rawContexts.entries()) {
        const contextLabel = `${routeLabel}: context ${contextIndex + 1}`
        const parsed = exactContextField(rawContext, issues, contextLabel, ['stage'])
        if (!parsed || typeof rawContext !== 'object' || rawContext === null || Array.isArray(rawContext)) continue
        const stage = stringField(rawContext as Record<string, unknown>, 'stage', issues, contextLabel) || ''
        contexts.push({ stage, ...parsed })
      }
    }
    routes.push({ id: stringField(route, 'id', issues, routeLabel) || '', contexts })
  }
  return routes
}

function businessRuleTargetsField(
  data: Record<string, unknown>,
  issues: string[],
  label: string
): BusinessRuleTarget[] {
  const value = data.appliesTo
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    issues.push(`${label}: "appliesTo" must be a list`)
    return []
  }
  const targets: BusinessRuleTarget[] = []
  for (const [index, raw] of value.entries()) {
    const targetLabel = `${label}: appliesTo item ${index + 1}`
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      issues.push(`${targetLabel} must be a mapping`)
      continue
    }
    const target = raw as Record<string, unknown>
    const type = stringField(target, 'type', issues, targetLabel) || ''
    if (type === 'context') {
      rejectUnknownKeys(target, ['type', 'interface', 'experience'], issues, targetLabel)
      const parsed = exactContextField(target, issues, targetLabel, ['type'])
      if (parsed) targets.push({ type: 'context', ...parsed })
      continue
    }
    rejectUnknownKeys(target, ['type', 'id', 'contexts'], issues, targetLabel)
    const rawContexts = target.contexts
    const contexts: ExactContext[] = []
    if (rawContexts !== undefined && rawContexts !== null) {
      if (!Array.isArray(rawContexts) || rawContexts.length === 0) {
        issues.push(`${targetLabel}: "contexts" must be a non-empty list when present`)
      } else {
        for (const [contextIndex, rawContext] of rawContexts.entries()) {
          const parsed = exactContextField(rawContext, issues, `${targetLabel}: context ${contextIndex + 1}`)
          if (parsed) contexts.push(parsed)
        }
      }
    }
    targets.push({
      type: type as BusinessRuleEntityTargetType,
      id: stringField(target, 'id', issues, targetLabel) || '',
      contexts
    })
  }
  return targets
}

/** Load the strict schema 4 .businesslens/ folder, collecting parse issues. */
export function loadModel(cwd: string): PddModel {
  const root = join(cwd, FOLDER)
  const issues: string[] = []
  if (!existsSync(root)) {
    issues.push(`${FOLDER}/ does not exist — use \`businesslens-map\` for established code or \`businesslens-ideate\` for a new product`)
  } else {
    if (!existsSync(join(root, 'README.md'))) issues.push('README.md is missing')

    const gitignoreFile = join(root, '.gitignore')
    if (!existsSync(gitignoreFile)) {
      issues.push('.gitignore is missing')
    } else {
      const patterns = new Set(
        readFileSync(gitignoreFile, 'utf8')
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.startsWith('#'))
      )
      for (const generated of ['build/', 'cache/']) {
        if (!patterns.has(generated)) issues.push(`.gitignore must ignore ${generated}`)
      }
    }
  }

  if (existsSync(root)) {
    try {
      readProductLogo(cwd)
    } catch (error) {
      issues.push(`logo.svg: ${(error as Error).message}`)
    }
  }

  let config = { schema: 4, sddPaths: [] as string[] }
  const configFile = join(root, 'config.yaml')
  if (existsSync(configFile)) {
    try {
      const raw = parse(readFileSync(configFile, 'utf8')) as Record<string, any> | null
      const keys = Object.keys(raw || {}).filter(key => key !== 'schema' && key !== 'sdd')
      for (const key of keys) issues.push(`config.yaml: unknown key "${key}"`)
      if (raw?.sdd !== undefined && (typeof raw.sdd !== 'object' || raw.sdd === null || Array.isArray(raw.sdd))) {
        issues.push('config.yaml: "sdd" must be a mapping')
      } else if (raw?.sdd) {
        for (const key of Object.keys(raw.sdd).filter(key => key !== 'paths')) {
          issues.push(`config.yaml: sdd has unknown key "${key}"`)
        }
      }
      config = {
        schema: Number(raw?.schema ?? 0),
        sddPaths: Array.isArray(raw?.sdd?.paths) ? raw.sdd.paths.map(String) : []
      }
    } catch (error) {
      issues.push(`config.yaml failed to parse (${(error as Error).message})`)
    }
  } else if (existsSync(root)) {
    issues.push('config.yaml is missing')
  }
  if (config.schema !== 4) {
    issues.push(`config.yaml: schema ${config.schema} is not supported (expected 4)`)
  }
  if (existsSync(join(root, 'features'))) {
    issues.push('features/: unsupported schema 2 collection; use capabilities/ with schema 4')
  }

  let scenarioKinds: ScenarioKind[] = []
  const taxonomiesFile = join(root, 'taxonomies.yaml')
  if (existsSync(taxonomiesFile)) {
    try {
      const raw = parse(readFileSync(taxonomiesFile, 'utf8')) as Record<string, any> | null
      const kinds = raw?.scenarioKinds
      if (!Array.isArray(kinds)) issues.push('taxonomies.yaml must contain a scenarioKinds list')
      else {
        scenarioKinds = kinds.map((kind: Record<string, unknown>) => ({
          id: String(kind.id || ''),
          name: String(kind.name || ''),
          description: String(kind.description || ''),
          colorSlot: typeof kind.colorSlot === 'number' ? kind.colorSlot : undefined
        }))
      }
    } catch (error) {
      issues.push(`taxonomies.yaml failed to parse (${(error as Error).message})`)
    }
  } else if (existsSync(root)) {
    issues.push('taxonomies.yaml is missing')
  }

  let product: PddModel['product'] = {
    id: '', tags: [], authors: [], limitations: [], doc: { title: '', lead: '', sections: [] }, references: []
  }
  const productFile = join(root, 'product.md')
  if (existsSync(productFile)) {
    const source = readFileSync(productFile, 'utf8')
    const { data, body } = splitFrontmatter(source, issues, 'product.md')
    rejectUnknownKeys(
      data,
      ['id', 'summary', 'category', 'tags', 'authors', 'license', 'limitations', 'references'],
      issues,
      'product.md'
    )
    const rawAuthors = data.authors
    const authors: ProductAuthor[] = []
    if (rawAuthors !== undefined && rawAuthors !== null) {
      if (!Array.isArray(rawAuthors)) {
        issues.push('product.md: "authors" must be a list')
      } else {
        for (const [index, item] of rawAuthors.entries()) {
          if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            issues.push(`product.md: author ${index + 1} must contain "name" and optional "url"`)
            continue
          }
          const author = item as Record<string, unknown>
          const unknown = Object.keys(author).filter(key => key !== 'name' && key !== 'url')
          if (unknown.length) issues.push(`product.md: author ${index + 1} has unknown field(s): ${unknown.join(', ')}`)
          if (typeof author.name !== 'string') {
            issues.push(`product.md: author ${index + 1} "name" must be a string`)
            continue
          }
          if (author.url !== undefined && typeof author.url !== 'string') {
            issues.push(`product.md: author ${index + 1} "url" must be a string`)
            continue
          }
          authors.push({ name: author.name, ...(author.url ? { url: author.url } : {}) })
        }
      }
    }
    product = {
      id: stringField(data, 'id', issues, 'product.md') || '',
      summary: stringField(data, 'summary', issues, 'product.md'),
      category: stringField(data, 'category', issues, 'product.md'),
      tags: uniqueStringListField(data, 'tags', issues, 'product.md'),
      authors,
      license: stringField(data, 'license', issues, 'product.md'),
      limitations: stringListField(data, 'limitations', issues, 'product.md'),
      doc: parseMarkdown(body),
      references: referencesField(data, issues, 'product.md')
    }
  } else if (existsSync(root)) {
    issues.push('product.md is missing')
  }

  let coverage: PddModel['coverage'] = {
    status: 'draft', method: [], sourceAreas: [], unmapped: [], limitations: [], rationale: ''
  }
  const coverageFile = join(root, 'coverage.md')
  if (existsSync(coverageFile)) {
    const source = readFileSync(coverageFile, 'utf8')
    const { data, body } = splitFrontmatter(source, issues, 'coverage.md')
    const doc = parseMarkdown(body)
    rejectUnknownKeys(data, ['status', 'method', 'sourceAreas', 'unmapped', 'limitations'], issues, 'coverage.md')
    if (containsStructuralHeading(doc.lead)) {
      issues.push('coverage.md: rationale must not contain an H1 or H2 heading')
    }
    for (const item of doc.sections) {
      issues.push(`coverage.md: "## ${item.heading}" sections are not supported; keep the rationale in the lead paragraph`)
    }
    coverage = {
      status: stringField(data, 'status', issues, 'coverage.md') || 'draft',
      method: stringListField(data, 'method', issues, 'coverage.md'),
      sourceAreas: stringListField(data, 'sourceAreas', issues, 'coverage.md'),
      unmapped: stringListField(data, 'unmapped', issues, 'coverage.md'),
      limitations: stringListField(data, 'limitations', issues, 'coverage.md'),
      rationale: doc.lead
    }
  } else if (existsSync(root)) {
    issues.push('coverage.md is missing')
  }

  const actors: ActorEntity[] = listMarkdown(join(root, 'actors')).map((name) => {
    const file = join(root, 'actors', name)
    const { data, doc, references } = readEntity(file, ['kind', 'relationship'], issues)
    return {
      id: stem(name), file, doc, references,
      kind: stringField(data, 'kind', issues, file) || '',
      relationship: stringField(data, 'relationship', issues, file) || ''
    }
  })

  const interfaces: InterfaceEntity[] = listMarkdown(join(root, 'interfaces')).map((name) => {
    const file = join(root, 'interfaces', name)
    const { data, doc, references } = readEntity(file, ['actors', 'entryPoints'], issues)
    return {
      id: stem(name), file, doc, references,
      actors: uniqueStringListField(data, 'actors', issues, file),
      entryPoints: entryPointsField(data, issues, file),
      capabilityBoundary: section(doc, 'Capability boundary') || ''
    }
  })

  const experiences: ExperienceEntity[] = listMarkdown(join(root, 'experiences')).map((name) => {
    const file = join(root, 'experiences', name)
    const { data, doc, references } = readEntity(
      file,
      ['actors', 'interfaces', 'access', 'entryPoints'],
      issues
    )
    return {
      id: stem(name), file, doc, references,
      actors: uniqueStringListField(data, 'actors', issues, file),
      interfaces: uniqueStringListField(data, 'interfaces', issues, file),
      access: stringField(data, 'access', issues, file) || '',
      entryPoints: entryPointsField(data, issues, file),
      capabilityBoundary: section(doc, 'Capability boundary') || ''
    }
  })

  const domains: DomainEntity[] = listMarkdown(join(root, 'domains')).map((name) => {
    const file = join(root, 'domains', name)
    const { data, doc, references } = readEntity(file, ['colorSlot'], issues)
    return {
      id: stem(name), file, doc, references,
      colorSlot: typeof data.colorSlot === 'number' ? data.colorSlot : undefined
    }
  })

  const capabilities: CapabilityEntity[] = listMarkdown(join(root, 'capabilities')).map((name) => {
    const file = join(root, 'capabilities', name)
    const { data, doc, references } = readEntity(file, ['domain', 'availability'], issues)
    return {
      id: stem(name), file, doc, references,
      domain: stringField(data, 'domain', issues, file),
      availability: availabilityField(data, issues, file)
    }
  })

  const screens: ScreenEntity[] = listMarkdown(join(root, 'screens')).map((name) => {
    const file = join(root, 'screens', name)
    const { data, doc, references } = readEntity(
      file,
      ['availability', 'capabilities', 'capabilityScenarios', 'journeyScenarios', 'entryPoints'],
      issues
    )
    return {
      id: stem(name), file, doc, references,
      availability: availabilityField(data, issues, file),
      capabilities: uniqueStringListField(data, 'capabilities', issues, file),
      capabilityScenarios: uniqueStringListField(data, 'capabilityScenarios', issues, file),
      journeyScenarios: uniqueStringListField(data, 'journeyScenarios', issues, file),
      entryPoints: entryPointsField(data, issues, file),
      information: bulletList(section(doc, 'Information presented') || ''),
      actions: bulletList(section(doc, 'Available actions') || ''),
      states: screenStates(section(doc, 'Product states') || '', issues, file),
      capabilityBoundary: section(doc, 'Capability boundary') || ''
    }
  })

  const businessRules: BusinessRuleEntity[] = listMarkdown(join(root, 'business-rules')).map((name) => {
    const file = join(root, 'business-rules', name)
    const { data, doc, references } = readEntity(
      file,
      ['appliesTo'],
      issues
    )
    return {
      id: stem(name), file, doc, references,
      appliesTo: businessRuleTargetsField(data, issues, file),
      rationale: section(doc, 'Rationale') || ''
    }
  })

  const capabilityScenarios: CapabilityScenarioEntity[] = listMarkdown(join(root, 'capability-scenarios')).map((name) => {
    const file = join(root, 'capability-scenarios', name)
    const { data, doc, references } = readEntity(file, ['kind', 'capability', 'actors', 'availability'], issues)
    return {
      id: stem(name), file, doc, references,
      kind: stringField(data, 'kind', issues, file) || '',
      capability: stringField(data, 'capability', issues, file) || '',
      actors: uniqueStringListField(data, 'actors', issues, file),
      availability: availabilityField(data, issues, file),
      ...readScenarioSections(doc, issues, file)
    }
  })

  const journeys: JourneyEntity[] = listMarkdown(join(root, 'journeys')).map((name) => {
    const file = join(root, 'journeys', name)
    const { data, doc, references } = readEntity(file, ['actors'], issues)
    return {
      id: stem(name), file, doc, references,
      actors: uniqueStringListField(data, 'actors', issues, file),
      goal: section(doc, 'Goal') || '',
      successCriterion: section(doc, 'Success criterion') || ''
    }
  })

  const journeyScenarios: JourneyScenarioEntity[] = listMarkdown(join(root, 'journey-scenarios')).map((name) => {
    const file = join(root, 'journey-scenarios', name)
    const { data, doc, references } = readEntity(file, ['kind', 'journey', 'actors', 'result', 'flow', 'routes'], issues)
    return {
      id: stem(name), file, doc, references,
      kind: stringField(data, 'kind', issues, file) || '',
      journey: stringField(data, 'journey', issues, file) || '',
      actors: uniqueStringListField(data, 'actors', issues, file),
      result: stringField(data, 'result', issues, file) || '',
      flow: journeyFlowField(data, issues, file),
      routes: journeyRoutesField(data, issues, file),
      ...readScenarioSections(doc, issues, file)
    }
  })

  return {
    root,
    config,
    product,
    scenarioKinds,
    coverage,
    actors,
    interfaces,
    experiences,
    screens,
    domains,
    capabilities,
    capabilityScenarios,
    businessRules,
    journeys,
    journeyScenarios,
    issues
  }
}
