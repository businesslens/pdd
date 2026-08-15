import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import { parse } from 'yaml'
import type { CompactEntryPoint, EntityAsset, EntityReference, Scope } from './frontmatter.js'
import type { MarkdownDoc } from './markdown.js'
import {
  assetsField,
  availabilityField,
  entryPointsField,
  scopeField,
  scopeListField,
  referencesField,
  rejectUnknownKeys,
  splitFrontmatter,
  stringField,
  stringListField,
  uniqueStringListField
} from './frontmatter.js'
import { counterpartKey, interfaceOf, qualify } from './ids.js'
import { readProductLogo } from './logo-file.js'
import {
  bulletList, containsStructuralHeading, decisionPoints, orderedList, parseMarkdown, screenStates, section
} from './markdown.js'

export interface EntityFile {
  id: string
  file: string
  /**
   * The entity's expanded namespace, whether or not it currently exists.
   * Assets sit beside `<type>.md`; children are typed subfolders.
   */
  directory: string
  doc: MarkdownDoc
  references: EntityReference[]
  /**
   * Files found beside `<type>.md`, path-relative to the entity folder.
   *
   * Anything under `implementation/` describes this realization of the Product
   * and is workspace-profile only; everything else is authored intent and
   * travels with a published Blueprint.
   */
  assets: string[]
  /** Optional authored metadata over those files. Never sets class. */
  assetMeta: EntityAsset[]
}

export interface ActorEntity extends EntityFile {
  kind: string
  relationship: string
}

export interface InterfaceEntity extends EntityFile {
  actors: string[]
  entryPoints: CompactEntryPoint[]
  capabilityBoundary: string
  /** Optional reading order over this Interface's own direct Screens. */
  screens: string[]
}

export interface ExperienceEntity extends EntityFile {
  actors: string[]
  /** The one Interface that owns it, read from the path. Never authored. */
  interface: string
  access: string
  entryPoints: CompactEntryPoint[]
  capabilityBoundary: string
  /** Optional reading order over this Experience's own Screens. */
  screens: string[]
}

export interface DomainEntity extends EntityFile {
  colorSlot?: number
  boundary: string
}

export interface CapabilityEntity extends EntityFile {
  domain?: string
  availability: Scope[]
}

export interface ScreenEntity extends EntityFile {
  /** The scope that owns it, read from the path. Never authored. */
  scope: Scope
  availability: Scope[]
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
  outcome: string
  edgeCases: string[]
  decisionPoints: ReturnType<typeof decisionPoints>
}

export interface CapabilityScenarioEntity extends ScenarioEntity {
  /** The Capability that owns it, read from the path. Never authored. */
  capability: string
  availability: Scope[]
  steps: string[]
}

/** One exact context is one scope id. */
export type ExactContext = Scope

export interface JourneyStepRoute {
  id: string
  context: Scope
}

export interface JourneyStep {
  text: string
  capability?: string
  routes: JourneyStepRoute[]
}

export interface JourneyScenarioEntity extends ScenarioEntity {
  /** The Journey that owns it, read from the path. Never authored. */
  journey: string
  result: string
  steps: JourneyStep[]
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

export interface BusinessRuleContextTarget {
  type: 'context'
  context: Scope
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

/** One compact or expanded entity: its id segment, namespace, and Markdown file. */
export interface EntityLocation {
  id: string
  /** `<collection>/<id>/`, including for a compact entity where it does not exist. */
  directory: string
  file: string
  expanded: boolean
}

/**
 * The compact files and expanded folders of one collection, in id order.
 *
 * `<id>.md` is canonical while an entity has no owned children or assets.
 * `<id>/<type>.md` is required once it needs that namespace. The logical id is
 * identical in both forms, and the two forms may never coexist.
 *
 * Anything unexpected is reported rather than skipped. A dropped entry used to
 * vanish with no finding, so a misplaced file looked exactly like one that was
 * never written.
 */
function listEntities(
  parent: string,
  type: string,
  issues: string[],
  collection: string,
  childDirectories: string[] = []
): EntityLocation[] {
  if (!existsSync(parent)) return []
  const found: EntityLocation[] = []
  const compact = new Map<string, string>()
  const expanded = new Map<string, string>()

  for (const entry of readdirSync(parent, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue
    if (entry.isFile()) {
      if (!entry.name.endsWith('.md')) {
        issues.push(`${collection}/${entry.name}: expected <id>.md or <id>/${type}.md`)
        continue
      }
      compact.set(entry.name.slice(0, -3), join(parent, entry.name))
      continue
    }
    if (entry.isDirectory()) {
      expanded.set(entry.name, join(parent, entry.name))
      continue
    }
    issues.push(`${collection}/${entry.name}: expected a regular entity file or directory`)
  }

  const ids = new Set([...compact.keys(), ...expanded.keys()])
  for (const id of [...ids].sort((a, b) => a.localeCompare(b))) {
    const compactFile = compact.get(id)
    const directory = expanded.get(id) ?? join(parent, id)
    const expandedFile = join(directory, `${type}.md`)
    const hasExpandedFile = existsSync(expandedFile)

    if (compactFile && expanded.has(id)) {
      issues.push(
        hasExpandedFile
          ? `${collection}/${id}: both ${id}.md and ${id}/${type}.md exist; keep exactly one entity shape`
          : `${collection}/${id}.md cannot also have ${collection}/${id}/; move it to ${collection}/${id}/${type}.md before adding children or assets`
      )
      found.push({ id, directory, file: compactFile, expanded: false })
      continue
    }

    if (compactFile) {
      found.push({ id, directory, file: compactFile, expanded: false })
      continue
    }

    if (!hasExpandedFile) {
      issues.push(`${collection}/${id}/ is missing ${type}.md`)
      continue
    }

    let ownsContent = false
    for (const child of readdirSync(directory, { withFileTypes: true })) {
      if (child.name === '.DS_Store' || child.name === `${type}.md`) continue
      if (child.isFile()) {
        ownsContent = true
        continue
      }
      if (child.isDirectory() && (child.name === 'implementation' || childDirectories.includes(child.name))) {
        const contents = readdirSync(join(directory, child.name), { withFileTypes: true })
          .filter(item => item.name !== '.DS_Store')
        if (contents.length) ownsContent = true
        continue
      }
      if (child.isDirectory()) {
        issues.push(`${collection}/${id}/${child.name}/ is not a recognized child directory`)
        continue
      }
      issues.push(`${collection}/${id}/${child.name}: assets must be regular files`)
    }

    if (!ownsContent) {
      issues.push(
        `${collection}/${id}/ has no assets or child entities; use ${collection}/${id}.md`
      )
    }
    found.push({ id, directory, file: expandedFile, expanded: true })
  }
  return found
}

/** Every file beside `<type>.md`, plus everything under `implementation/`. */
function listAssets(directory: string, ownFile: string): string[] {
  const found: string[] = []
  if (!existsSync(directory)) return found
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.DS_Store' || entry.name === ownFile) continue
    if (entry.isFile()) found.push(entry.name)
    else if (entry.name === 'implementation') {
      for (const child of readdirSync(join(directory, 'implementation'), { withFileTypes: true })) {
        if (child.isFile() && child.name !== '.DS_Store') found.push(`implementation/${child.name}`)
      }
    }
  }
  return found.sort()
}

function readEntity(
  location: Pick<EntityLocation, 'file' | 'directory' | 'expanded'>,
  allowedKeys: string[],
  issues: string[]
): {
  data: Record<string, unknown>
  doc: MarkdownDoc
  references: EntityReference[]
  directory: string
  assets: string[]
  assetMeta: EntityAsset[]
} {
  const { file, directory, expanded } = location
  const source = readFileSync(file, 'utf8')
  const { data, body } = splitFrontmatter(source, issues, file)
  rejectUnknownKeys(data, [...allowedKeys, 'references', 'assets'], issues, file)
  const doc = parseMarkdown(body)
  return {
    data,
    doc,
    references: referencesField(data, issues, file),
    directory,
    assets: expanded ? listAssets(directory, basename(file)) : [],
    assetMeta: assetsField(data, issues, file)
  }
}

function readScenarioSections(doc: MarkdownDoc, issues: string[], file: string) {
  return {
    trigger: section(doc, 'Trigger') || '',
    outcome: section(doc, 'Outcome') || '',
    edgeCases: bulletList(section(doc, 'Edge cases') || ''),
    decisionPoints: decisionPoints(section(doc, 'Decision points') || '', issues, file)
  }
}

function journeyStepsField(
  data: Record<string, unknown>,
  issues: string[],
  label: string
): JourneyStep[] {
  const value = data.steps
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    issues.push(`${label}: "steps" must be a list`)
    return []
  }
  const steps: JourneyStep[] = []
  for (const [index, raw] of value.entries()) {
    const itemLabel = `${label}: step ${index + 1}`
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      issues.push(`${itemLabel} must be a mapping`)
      continue
    }
    const item = raw as Record<string, unknown>
    rejectUnknownKeys(item, ['text', 'capability', 'routes'], issues, itemLabel)
    const routes: JourneyStepRoute[] = []
    if (item.routes !== undefined && item.routes !== null) {
      if (typeof item.routes !== 'object' || Array.isArray(item.routes)) {
        issues.push(`${itemLabel}: "routes" must be a mapping from route id to exact context`)
      } else {
        for (const [id, rawContext] of Object.entries(item.routes as Record<string, unknown>)) {
          const context = scopeField({ context: rawContext }, 'context', issues, `${itemLabel}: route "${id}"`)
          if (context) routes.push({ id, context })
        }
      }
    }
    steps.push({
      text: stringField(item, 'text', issues, itemLabel) || '',
      capability: stringField(item, 'capability', issues, itemLabel),
      routes
    })
  }
  return steps
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
  rejectUnknownKeys(item, ['context', ...allowedExtra], issues, label)
  return scopeField(item, 'context', issues, label)
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
      rejectUnknownKeys(target, ['type', 'context'], issues, targetLabel)
      const parsed = exactContextField(target, issues, targetLabel, ['type'])
      if (parsed) targets.push({ type: 'context', context: parsed })
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

/** Load the strict schema 5 .businesslens/ folder, collecting parse issues. */
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

  let config = { schema: 5, sddPaths: [] as string[] }
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
  if (config.schema !== 5) {
    issues.push(`config.yaml: schema ${config.schema} is not supported (expected 5)`)
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
  const compactProductFile = join(root, 'product.md')
  const productDirectory = join(root, 'product')
  const expandedProductFile = join(productDirectory, 'product.md')
  const hasCompactProduct = existsSync(compactProductFile)
  const hasProductDirectory = existsSync(productDirectory)
  const hasExpandedProduct = existsSync(expandedProductFile)
  const productLogoFile = join(productDirectory, 'logo.svg')

  if (hasCompactProduct && hasProductDirectory) {
    issues.push(
      hasExpandedProduct
        ? 'product: both product.md and product/product.md exist; keep exactly one entity shape'
        : 'product.md cannot also have product/; move it to product/product.md before adding logo.svg'
    )
  }
  if (hasProductDirectory && !hasExpandedProduct && !hasCompactProduct) {
    issues.push('product/ is missing product.md')
  }
  if (hasExpandedProduct && !existsSync(productLogoFile)) {
    issues.push('product/ has no logo asset; use product.md')
  }
  if (hasProductDirectory) {
    for (const entry of readdirSync(productDirectory, { withFileTypes: true })) {
      if (entry.name === '.DS_Store' || entry.name === 'product.md' || entry.name === 'logo.svg') continue
      issues.push(`product/${entry.name}: the Product folder may contain only product.md and logo.svg`)
    }
  }

  const productFile = hasCompactProduct ? compactProductFile : hasExpandedProduct ? expandedProductFile : undefined
  if (productFile) {
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

  const actors: ActorEntity[] = listEntities(join(root, 'actors'), 'actor', issues, 'actors')
    .map((location) => {
      const { id, file } = location
      const { data, doc, references, directory, assets, assetMeta } = readEntity(location, ['kind', 'relationship'], issues)
      return {
        id, file, doc, references, directory, assets, assetMeta,
        kind: stringField(data, 'kind', issues, file) || '',
        relationship: stringField(data, 'relationship', issues, file) || ''
      }
    })

  /*
    The surface tree is walked, not listed. An Experience belongs to exactly one
    Interface and a Screen to exactly one scope, so the path is the parent
    relation and the id — one authority instead of two that can disagree, and
    reparenting becomes a `git mv` that reads correctly in a pull request.
  */
  const interfaces: InterfaceEntity[] = []
  const experiences: ExperienceEntity[] = []
  const screens: ScreenEntity[] = []

  const readScreens = (parent: string, scope: Scope, label: string) => {
    for (const location of listEntities(join(parent, 'screens'), 'screen', issues, `${label}/screens`)) {
      const { data, doc, references, directory, assets, assetMeta } = readEntity(
        location,
        ['capabilities', 'capabilityScenarios', 'journeyScenarios', 'entryPoints', 'availability'],
        issues
      )
      screens.push({
        id: qualify(scope, location.id),
        file: location.file,
        doc,
        references,
        directory,
        assets,
        assetMeta,
        scope,
        // A Screen reaches exactly the scope that owns it. The field stays as a
        // single-element list so every consumer keeps one shape.
        availability: [scope],
        capabilities: uniqueStringListField(data, 'capabilities', issues, location.file),
        capabilityScenarios: uniqueStringListField(data, 'capabilityScenarios', issues, location.file),
        journeyScenarios: uniqueStringListField(data, 'journeyScenarios', issues, location.file),
        entryPoints: entryPointsField(data, issues, location.file),
        information: bulletList(section(doc, 'Information presented') || ''),
        actions: bulletList(section(doc, 'Available actions') || ''),
        states: screenStates(section(doc, 'Product states') || '', issues, location.file),
        capabilityBoundary: section(doc, 'Capability boundary') || ''
      })
    }
  }

  for (const productInterface of listEntities(
    join(root, 'interfaces'),
    'interface',
    issues,
    'interfaces',
    ['experiences', 'screens']
  )) {
    const { data, doc, references, directory, assets, assetMeta } = readEntity(
      productInterface,
      ['actors', 'entryPoints', 'screens'],
      issues
    )
    interfaces.push({
      id: productInterface.id,
      file: productInterface.file,
      doc,
      references,
      directory,
      assets,
      assetMeta,
      actors: uniqueStringListField(data, 'actors', issues, productInterface.file),
      entryPoints: entryPointsField(data, issues, productInterface.file),
      capabilityBoundary: section(doc, 'Capability boundary') || '',
      screens: uniqueStringListField(data, 'screens', issues, productInterface.file)
    })

    const experienceLocations = listEntities(
      join(productInterface.directory, 'experiences'),
      'experience',
      issues,
      `interfaces/${productInterface.id}/experiences`,
      ['screens']
    )
    const hasDirectScreens = existsSync(join(productInterface.directory, 'screens'))
    if (experienceLocations.length && hasDirectScreens) {
      // Otherwise the scope id `reader-web` would be ambiguous between the whole
      // Interface and the part of it with no Experience.
      issues.push(
        `interfaces/${productInterface.id}/: an Interface holds either screens/ or experiences/, never both`
      )
    }

    for (const location of experienceLocations) {
      const experienceId = qualify(productInterface.id, location.id)
      const parsed = readEntity(location, ['actors', 'access', 'entryPoints', 'screens'], issues)
      experiences.push({
        id: experienceId,
        file: location.file,
        doc: parsed.doc,
        references: parsed.references,
        directory: parsed.directory,
        assets: parsed.assets,
        assetMeta: parsed.assetMeta,
        actors: uniqueStringListField(parsed.data, 'actors', issues, location.file),
        interface: productInterface.id,
        access: stringField(parsed.data, 'access', issues, location.file) || '',
        entryPoints: entryPointsField(parsed.data, issues, location.file),
        capabilityBoundary: section(parsed.doc, 'Capability boundary') || '',
        screens: uniqueStringListField(parsed.data, 'screens', issues, location.file)
      })
      readScreens(location.directory, experienceId, `interfaces/${productInterface.id}/experiences/${location.id}`)
    }

    if (!experienceLocations.length) {
      readScreens(productInterface.directory, productInterface.id, `interfaces/${productInterface.id}`)
    }
  }

  const domains: DomainEntity[] = listEntities(join(root, 'domains'), 'domain', issues, 'domains')
    .map((location) => {
      const { id, file } = location
      const { data, doc, references, directory, assets, assetMeta } = readEntity(location, ['colorSlot'], issues)
      return {
        id, file, doc, references, directory, assets, assetMeta,
        colorSlot: typeof data.colorSlot === 'number' ? data.colorSlot : undefined,
        boundary: section(doc, 'Boundary') || ''
      }
    })

  const capabilities: CapabilityEntity[] = []
  const capabilityScenarios: CapabilityScenarioEntity[] = []
  for (const location of listEntities(
    join(root, 'capabilities'),
    'capability',
    issues,
    'capabilities',
    ['scenarios']
  )) {
    const { data, doc, references, directory, assets, assetMeta } = readEntity(location, ['domain', 'availability'], issues)
    capabilities.push({
      id: location.id,
      file: location.file,
      doc,
      references,
      directory,
      assets,
      assetMeta,
      domain: stringField(data, 'domain', issues, location.file),
      availability: availabilityField(data, issues, location.file)
    })
    for (const scenario of listEntities(
      join(location.directory, 'scenarios'),
      'capability-scenario',
      issues,
      `capabilities/${location.id}/scenarios`
    )) {
      const parsed = readEntity(scenario, ['kind', 'actors', 'availability'], issues)
      capabilityScenarios.push({
        id: scenario.id,
        file: scenario.file,
        doc: parsed.doc,
        references: parsed.references,
        directory: parsed.directory,
        assets: parsed.assets,
        assetMeta: parsed.assetMeta,
        kind: stringField(parsed.data, 'kind', issues, scenario.file) || '',
        capability: location.id,
        actors: uniqueStringListField(parsed.data, 'actors', issues, scenario.file),
        availability: availabilityField(parsed.data, issues, scenario.file),
        steps: orderedList(section(parsed.doc, 'Steps') || ''),
        ...readScenarioSections(parsed.doc, issues, scenario.file)
      })
    }
  }

  const journeys: JourneyEntity[] = []
  const journeyScenarios: JourneyScenarioEntity[] = []
  for (const location of listEntities(
    join(root, 'journeys'),
    'journey',
    issues,
    'journeys',
    ['scenarios']
  )) {
    const { data, doc, references, directory, assets, assetMeta } = readEntity(location, ['actors'], issues)
    journeys.push({
      id: location.id,
      file: location.file,
      doc,
      references,
      directory,
      assets,
      assetMeta,
      actors: uniqueStringListField(data, 'actors', issues, location.file),
      goal: section(doc, 'Goal') || '',
      successCriterion: section(doc, 'Success criterion') || ''
    })
    for (const scenario of listEntities(
      join(location.directory, 'scenarios'),
      'journey-scenario',
      issues,
      `journeys/${location.id}/scenarios`
    )) {
      const parsed = readEntity(scenario, ['kind', 'actors', 'result', 'steps', 'flow', 'routes'], issues)
      if (parsed.data.flow !== undefined) {
        issues.push(`${scenario.file}: "flow" is no longer supported; use the frontmatter "steps" list`)
        if (Array.isArray(parsed.data.flow) && parsed.data.flow.some(item =>
          typeof item === 'object' && item !== null && !Array.isArray(item) && 'operation' in item
        )) {
          issues.push(`${scenario.file}: "operation" is no longer supported; put each sentence in "steps[].text"`)
        }
      }
      if (parsed.data.routes !== undefined) {
        issues.push(`${scenario.file}: top-level "routes" is no longer supported; put route contexts inside each Capability-bearing step`)
      }
      journeyScenarios.push({
        id: scenario.id,
        file: scenario.file,
        doc: parsed.doc,
        references: parsed.references,
        directory: parsed.directory,
        assets: parsed.assets,
        assetMeta: parsed.assetMeta,
        kind: stringField(parsed.data, 'kind', issues, scenario.file) || '',
        journey: location.id,
        actors: uniqueStringListField(parsed.data, 'actors', issues, scenario.file),
        result: stringField(parsed.data, 'result', issues, scenario.file) || '',
        steps: journeyStepsField(parsed.data, issues, scenario.file),
        ...readScenarioSections(parsed.doc, issues, scenario.file)
      })
    }
  }

  const businessRules: BusinessRuleEntity[] = listEntities(
    join(root, 'business-rules'),
    'business-rule',
    issues,
    'business-rules'
  ).map((location) => {
    const { id, file } = location
    const { data, doc, references, directory, assets, assetMeta } = readEntity(location, ['appliesTo'], issues)
    return {
      id, file, doc, references, directory, assets, assetMeta,
      appliesTo: businessRuleTargetsField(data, issues, file),
      rationale: section(doc, 'Rationale') || ''
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
