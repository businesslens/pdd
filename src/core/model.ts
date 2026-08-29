import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import { parse } from 'yaml'
import type { CompactEntryPoint, Context, ResourceAsset, ResourceReference } from './frontmatter.js'
import type { MarkdownDoc } from './markdown.js'
import {
  assetsField,
  availabilityField,
  contextField,
  contextValue,
  entryPointsField,
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
  bulletList, containsStructuralHeading, decisionPoints, parseMarkdown, screenStates, section
} from './markdown.js'

export interface ResourceFile {
  id: string
  file: string
  /**
   * The resource's expanded namespace, whether or not it currently exists.
   * Assets sit beside `<type>.md`; children are typed subfolders.
   */
  directory: string
  doc: MarkdownDoc
  references: ResourceReference[]
  /**
   * Files found beside `<type>.md`, path-relative to the resource folder.
   *
   * Anything under `implementation/` describes this realization of the Product
   * and is workspace-profile only; everything else is authored intent and
   * travels with a published Blueprint.
   */
  assets: string[]
  /** Optional authored metadata over those files. Never sets class. */
  assetMeta: ResourceAsset[]
}

export interface ActorResource extends ResourceFile {
  /** What the Product keeps about this Actor. Same rule as an Entity's. */
  informationKept: string[]
  kind: string
  relationship: string
}

export interface InterfaceResource extends ResourceFile {
  type: string
  actors: string[]
  entryPoints: CompactEntryPoint[]
  capabilityBoundary: string
  /** Optional reading order over this Interface's own direct Screens. */
  screens: string[]
}

export interface ExperienceResource extends ResourceFile {
  actors: string[]
  /** The one Interface that owns it, read from the path. Never authored. */
  interface: string
  access: string
  entryPoints: CompactEntryPoint[]
  capabilityBoundary: string
  /** Optional reading order over this Experience's own Screens. */
  screens: string[]
}

export interface DomainResource extends ResourceFile {
  colorSlot?: number
  boundary: string
}

export interface CapabilityResource extends ResourceFile {
  domain?: string
  /** The Entities this Capability acts on. */
  entities: string[]
  availability: Context[]
}

export interface EntityStateTransition {
  from: string
  to: string
  /** The Capability that causes this move. Checked against its `entities`. */
  by: string
}

/**
 * Both ends of a relation, reading source to target.
 *
 * One end is not a relationship: "a Source publishes many Items" leaves
 * unanswered whether an Item may come from two feeds, and that is a product
 * decision rather than a storage detail. `many-to-one` is deliberately absent —
 * declare that relationship from the other Entity, where it reads
 * `one-to-many`, so one `1:N` has exactly one encoding.
 */
export type EntityCardinality = 'one-to-one' | 'one-to-many' | 'many-to-many'

/**
 * An edge to another Entity. Declared on one side only; the inverse is derived.
 * `verb` is the product's own word for the relationship.
 */
export interface EntityRelation {
  entity: string
  verb: string
  cardinality: EntityCardinality
}

/**
 * A thing the Product keeps whose state an Actor can observe and act on.
 *
 * Entities name the Product's nouns where Capabilities name its verbs. The test
 * is identity, not storage: a thing an Actor would point at and call "this one",
 * which the Product can tell apart from another.
 */
export interface EntityResource extends ResourceFile {
  domain?: string
  /** Single-line facts the Product keeps about the thing. Never how it is stored. */
  informationKept: string[]
  relations: EntityRelation[]
  states: ReturnType<typeof screenStates>
  transitions: EntityStateTransition[]
}

export interface ScreenResource extends ResourceFile {
  /** The Entities this view presents. */
  entities: string[]
  /** The Interface or Experience that owns it, read from the path. Never authored. */
  containerId: string
  capabilities: string[]
  entryPoints: CompactEntryPoint[]
  information: string[]
  actions: string[]
  states: ReturnType<typeof screenStates>
  capabilityBoundary: string
}

interface ScenarioResource extends ResourceFile {
  kind: string
  routes: ScenarioRoute[]
  steps: ScenarioStep[]
  trigger: string
  outcome: string
  edgeCases: string[]
  decisionPoints: ReturnType<typeof decisionPoints>
}

export interface CapabilityScenarioResource extends ScenarioResource {
  /** The Capability that owns it, read from the path. Never authored. */
  capability: string
}

export interface ScenarioRoute {
  id: string
  name: string
}

export type ScenarioStepKind = 'actor' | 'product' | 'condition'

export interface ScenarioStepContext extends Context {
  routeId: string
}

export interface ScenarioStep {
  /** The Entity this Step acts on, when it acts on one. */
  entity?: string
  /** The state that Entity is left in. Requires `entity`. */
  state?: string
  /**
   * Marks a Scenario nobody triggers — a schedule the Product owns, an expiry,
   * a retry. Valid only on the first Step and only when `kind` is `condition`.
   * Without it, unattended behavior had to be modelled as somebody else's
   * request or left with no acceptance coverage at all.
   */
  unattended?: boolean
  text: string
  kind: string
  actor?: string
  capability?: string
  contexts: ScenarioStepContext[]
}

export interface JourneyScenarioResource extends ScenarioResource {
  /** The Journey that owns it, read from the path. Never authored. */
  journey: string
  result: string
}

export interface JourneyResource extends ResourceFile {
  actors: string[]
  goal: string
  successCriterion: string
}

export interface BusinessRuleResource extends ResourceFile {
  appliesTo: BusinessRuleTarget[]
  rationale: string
}

export type BusinessRuleResourceTargetType =
  | 'capability'
  | 'capability-scenario'
  | 'journey'
  | 'journey-scenario'

export interface BusinessRuleResourceTarget {
  type: BusinessRuleResourceTargetType
  id: string
  contexts: Context[]
}

export interface BusinessRuleContextTarget {
  type: 'context'
  context: Context
}

export type BusinessRuleTarget = BusinessRuleResourceTarget | BusinessRuleContextTarget

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
    references: ResourceReference[]
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
  actors: ActorResource[]
  interfaces: InterfaceResource[]
  experiences: ExperienceResource[]
  screens: ScreenResource[]
  domains: DomainResource[]
  entities: EntityResource[]
  capabilities: CapabilityResource[]
  capabilityScenarios: CapabilityScenarioResource[]
  businessRules: BusinessRuleResource[]
  journeys: JourneyResource[]
  journeyScenarios: JourneyScenarioResource[]
  issues: string[]
  notices: string[]
}

/**
 * Every semantic resource collection on the model, keyed by its own name.
 *
 * The key union is derived from `PddModel` rather than written out, so adding an
 * resource kind to the model leaves this record incomplete and fails the build.
 * That is not defensive typing for its own sake: Entity was added as a kind
 * without it, and four separate "for every resource" checks — id shape, duplicate
 * ids, asset metadata, and reference targets — silently skipped Entities,
 * because each was a hand-written list nothing forced anyone to revisit.
 */
export type ResourceCollectionName = {
  [K in keyof PddModel]-?: PddModel[K] extends ResourceFile[] ? K : never
}[keyof PddModel]

export function resourceCollections(model: PddModel): Record<ResourceCollectionName, ResourceFile[]> {
  return {
    actors: model.actors,
    interfaces: model.interfaces,
    experiences: model.experiences,
    screens: model.screens,
    domains: model.domains,
    entities: model.entities,
    capabilities: model.capabilities,
    capabilityScenarios: model.capabilityScenarios,
    businessRules: model.businessRules,
    journeys: model.journeys,
    journeyScenarios: model.journeyScenarios
  }
}

/** Every semantic resource in the model, in collection order. */
export function allResources(model: PddModel): ResourceFile[] {
  return Object.values(resourceCollections(model)).flat()
}

const ENTITY_CARDINALITIES = new Set<string>(['one-to-one', 'one-to-many', 'many-to-many'])

export const FOLDER = '.businesslens'

/** The one folder-format version this release reads and writes. */
export const FOLDER_SCHEMA = 7

/**
 * The two channels a model load reports into.
 *
 * `issues` are states no correct model passes through and fail `lint`.
 * `notices` are advisory: the model is loadable and the finding describes a
 * shape an author is expected to reach in more than one step.
 */
export interface LoadFindings {
  issues: string[]
  notices: string[]
}

/** One compact or expanded resource: its id segment, namespace, and Markdown file. */
export interface ResourceLocation {
  id: string
  /** `<collection>/<id>/`, including for a compact resource where it does not exist. */
  directory: string
  file: string
  expanded: boolean
}

/**
 * The compact files and expanded folders of one collection, in id order.
 *
 * `<id>.md` is canonical while a resource has no owned children or assets.
 * `<id>/<type>.md` is required once it needs that namespace. The logical id is
 * identical in both forms, and the two forms may never coexist.
 *
 * Anything unexpected is reported rather than skipped. A dropped entry used to
 * vanish with no finding, so a misplaced file looked exactly like one that was
 * never written.
 */
function listResources(
  parent: string,
  type: string,
  findings: LoadFindings,
  collection: string,
  childDirectories: string[] = []
): ResourceLocation[] {
  if (!existsSync(parent)) return []
  const found: ResourceLocation[] = []
  const compact = new Map<string, string>()
  const expanded = new Map<string, string>()

  for (const entry of readdirSync(parent, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue
    if (entry.isFile()) {
      if (!entry.name.endsWith('.md')) {
        findings.issues.push(`${collection}/${entry.name}: expected <id>.md or <id>/${type}.md`)
        continue
      }
      compact.set(entry.name.slice(0, -3), join(parent, entry.name))
      continue
    }
    if (entry.isDirectory()) {
      expanded.set(entry.name, join(parent, entry.name))
      continue
    }
    findings.issues.push(`${collection}/${entry.name}: expected a regular resource file or directory`)
  }

  const ids = new Set([...compact.keys(), ...expanded.keys()])
  for (const id of [...ids].sort((a, b) => a.localeCompare(b))) {
    const compactFile = compact.get(id)
    const directory = expanded.get(id) ?? join(parent, id)
    const expandedFile = join(directory, `${type}.md`)
    const hasExpandedFile = existsSync(expandedFile)

    if (compactFile && expanded.has(id)) {
      findings.issues.push(
        hasExpandedFile
          ? `${collection}/${id}: both ${id}.md and ${id}/${type}.md exist; keep exactly one resource shape`
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
      findings.issues.push(`${collection}/${id}/ is missing ${type}.md`)
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
        findings.issues.push(`${collection}/${id}/${child.name}/ is not a recognized child directory`)
        continue
      }
      findings.issues.push(`${collection}/${id}/${child.name}: assets must be regular files`)
    }

    if (!ownsContent) {
      // Advisory, not an error: an author reaches the expanded shape in two
      // steps. Report expansion derives shape from owned children, so the round
      // trip normalizes this folder back to the compact form the rule requires.
      findings.notices.push(
        `${collection}/${id}/ has no assets or child resources; use ${collection}/${id}.md`
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

function readResource(
  location: Pick<ResourceLocation, 'file' | 'directory' | 'expanded'>,
  allowedKeys: string[],
  issues: string[]
): {
  data: Record<string, unknown>
  doc: MarkdownDoc
  references: ResourceReference[]
  directory: string
  assets: string[]
  assetMeta: ResourceAsset[]
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

function scenarioRoutesField(
  data: Record<string, unknown>,
  issues: string[],
  label: string
): ScenarioRoute[] {
  const value = data.routes
  if (value === undefined || value === null) return []
  if (typeof value !== 'object' || Array.isArray(value)) {
    issues.push(`${label}: "routes" must be a mapping from route id to route name`)
    return []
  }
  const routes: ScenarioRoute[] = []
  for (const [id, rawName] of Object.entries(value as Record<string, unknown>)) {
    const name = stringField({ name: rawName }, 'name', issues, `${label}: route "${id}"`)
    routes.push({ id, name: name || '' })
  }
  return routes
}

function scenarioStepsField(
  data: Record<string, unknown>,
  issues: string[],
  label: string,
  allowCapability: boolean
): ScenarioStep[] {
  const value = data.steps
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    issues.push(`${label}: "steps" must be a list`)
    return []
  }
  const steps: ScenarioStep[] = []
  for (const [index, raw] of value.entries()) {
    const itemLabel = `${label}: step ${index + 1}`
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      issues.push(`${itemLabel} must be a mapping`)
      continue
    }
    const item = raw as Record<string, unknown>
    rejectUnknownKeys(item, ['text', 'kind', 'actor', 'entity', 'state', 'contexts', 'unattended', ...(allowCapability ? ['capability'] : [])], issues, itemLabel)
    const contexts: ScenarioStepContext[] = []
    if (item.contexts !== undefined && item.contexts !== null) {
      if (typeof item.contexts !== 'object' || Array.isArray(item.contexts)) {
        issues.push(`${itemLabel}: "contexts" must map route ids to Context objects`)
      } else {
        for (const [routeId, rawContext] of Object.entries(item.contexts as Record<string, unknown>)) {
          const context = contextValue(rawContext, issues, `${itemLabel}: route "${routeId}"`)
          if (context) contexts.push({ routeId, ...context })
        }
      }
    }
    const unattended = item.unattended
    if (unattended !== undefined && typeof unattended !== 'boolean') {
      issues.push(`${itemLabel}: "unattended" must be true or false`)
    }
    steps.push({
      text: stringField(item, 'text', issues, itemLabel) || '',
      kind: stringField(item, 'kind', issues, itemLabel) || '',
      actor: stringField(item, 'actor', issues, itemLabel),
      entity: stringField(item, 'entity', issues, itemLabel),
      state: stringField(item, 'state', issues, itemLabel),
      capability: allowCapability ? stringField(item, 'capability', issues, itemLabel) : undefined,
      unattended: unattended === true ? true : undefined,
      contexts
    })
  }
  return steps
}

function parsedContextField(
  raw: unknown,
  issues: string[],
  label: string,
  allowedExtra: string[] = []
): Context | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    issues.push(`${label}: context target must be a mapping`)
    return undefined
  }
  const item = raw as Record<string, unknown>
  rejectUnknownKeys(item, ['context', ...allowedExtra], issues, label)
  return contextField(item, 'context', issues, label)
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
      const parsed = parsedContextField(target, issues, targetLabel, ['type'])
      if (parsed) targets.push({ type: 'context', context: parsed })
      continue
    }
    rejectUnknownKeys(target, ['type', 'id', 'contexts'], issues, targetLabel)
    const rawContexts = target.contexts
    const contexts: Context[] = []
    if (rawContexts !== undefined && rawContexts !== null) {
      if (!Array.isArray(rawContexts) || rawContexts.length === 0) {
        issues.push(`${targetLabel}: "contexts" must be a non-empty list when present`)
      } else {
        for (const [contextIndex, rawContext] of rawContexts.entries()) {
          const parsed = contextValue(rawContext, issues, `${targetLabel}: context ${contextIndex + 1}`)
          if (parsed) contexts.push(parsed)
        }
      }
    }
    targets.push({
      type: type as BusinessRuleResourceTargetType,
      id: stringField(target, 'id', issues, targetLabel) || '',
      contexts
    })
  }
  return targets
}

/** Load the strict schema 6 .businesslens/ folder, collecting parse issues. */
export function loadModel(cwd: string): PddModel {
  const root = join(cwd, FOLDER)
  const issues: string[] = []
  const notices: string[] = []
  const findings: LoadFindings = { issues, notices }
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

  let config = { schema: FOLDER_SCHEMA, sddPaths: [] as string[] }
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
  if (config.schema !== FOLDER_SCHEMA) {
    issues.push(`config.yaml: schema ${config.schema} is not supported (expected ${FOLDER_SCHEMA})`)
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
        ? 'product: both product.md and product/product.md exist; keep exactly one resource shape'
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

  const actors: ActorResource[] = listResources(join(root, 'actors'), 'actor', findings, 'actors')
    .map((location) => {
      const { id, file } = location
      const { data, doc, references, directory, assets, assetMeta } = readResource(location, ['kind', 'relationship'], issues)
      return {
        id, file, doc, references, directory, assets, assetMeta,
        informationKept: bulletList(section(doc, 'Information kept') || ''),
        kind: stringField(data, 'kind', issues, file) || '',
        relationship: stringField(data, 'relationship', issues, file) || ''
      }
    })

  /*
    The Interface → Experience → Screen hierarchy is walked, not listed. An
    Experience belongs to exactly one Interface and a Screen to exactly one parent, so the path is the parent
    relation and the id — one authority instead of two that can disagree, and
    reparenting becomes a `git mv` that reads correctly in a pull request.
  */
  const interfaces: InterfaceResource[] = []
  const experiences: ExperienceResource[] = []
  const screens: ScreenResource[] = []

  const readScreens = (parent: string, containerId: string, label: string) => {
    for (const location of listResources(join(parent, 'screens'), 'screen', findings, `${label}/screens`)) {
      const { data, doc, references, directory, assets, assetMeta } = readResource(
        location,
        ['capabilities', 'entities', 'entryPoints'],
        issues
      )
      screens.push({
        entities: uniqueStringListField(data, 'entities', issues, location.file),
        id: qualify(containerId, location.id),
        file: location.file,
        doc,
        references,
        directory,
        assets,
        assetMeta,
        containerId,
        capabilities: uniqueStringListField(data, 'capabilities', issues, location.file),
        entryPoints: entryPointsField(data, issues, location.file),
        information: bulletList(section(doc, 'Information presented') || ''),
        actions: bulletList(section(doc, 'Available actions') || ''),
        states: screenStates(section(doc, 'View states') || '', issues, location.file),
        capabilityBoundary: section(doc, 'Capability boundary') || ''
      })
    }
  }

  for (const productInterface of listResources(
    join(root, 'interfaces'),
    'interface',
    findings,
    'interfaces',
    ['experiences', 'screens']
  )) {
    const { data, doc, references, directory, assets, assetMeta } = readResource(
      productInterface,
      ['type', 'actors', 'entryPoints', 'screens'],
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
      type: stringField(data, 'type', issues, productInterface.file) || '',
      actors: uniqueStringListField(data, 'actors', issues, productInterface.file),
      entryPoints: entryPointsField(data, issues, productInterface.file),
      capabilityBoundary: section(doc, 'Capability boundary') || '',
      screens: uniqueStringListField(data, 'screens', issues, productInterface.file)
    })

    const experienceLocations = listResources(
      join(productInterface.directory, 'experiences'),
      'experience',
      findings,
      `interfaces/${productInterface.id}/experiences`,
      ['screens']
    )

    for (const location of experienceLocations) {
      const experienceId = qualify(productInterface.id, location.id)
      const parsed = readResource(location, ['actors', 'access', 'entryPoints', 'screens'], issues)
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

    // Screens beside experiences/ are shared across every Experience of this
    // Interface. A view common to several Experiences would otherwise have to be
    // duplicated into each of them.
    if (existsSync(join(productInterface.directory, 'screens'))) {
      readScreens(productInterface.directory, productInterface.id, `interfaces/${productInterface.id}`)
    }
  }

  const domains: DomainResource[] = listResources(join(root, 'domains'), 'domain', findings, 'domains')
    .map((location) => {
      const { id, file } = location
      const { data, doc, references, directory, assets, assetMeta } = readResource(location, ['colorSlot'], issues)
      return {
        id, file, doc, references, directory, assets, assetMeta,
        colorSlot: typeof data.colorSlot === 'number' ? data.colorSlot : undefined,
        boundary: section(doc, 'Boundary') || ''
      }
    })

  const entities: EntityResource[] = listResources(join(root, 'entities'), 'entity', findings, 'entities')
    .map((location) => {
      const { id, file } = location
      const { data, doc, references, directory, assets, assetMeta } =
        readResource(location, ['domain', 'relations', 'transitions'], issues)
      const informationKept = bulletList(section(doc, 'Information kept') || '')
      const states = screenStates(section(doc, 'States') || '', issues, file, 'States', 'entity state')
      const hasStates = section(doc, 'States') !== undefined

      // Identity, not storage: a thing may be worth naming for what the Product
      // keeps about it, for how it changes, or for both — but not for neither.
      if (!informationKept.length && !hasStates) {
        issues.push(`${file}: an Entity needs "## Information kept" or "## States"`)
      }

      const relations: EntityRelation[] = []
      const rawRelations = data.relations
      if (rawRelations !== undefined && rawRelations !== null) {
        if (!Array.isArray(rawRelations)) {
          issues.push(`${file}: "relations" must be a list`)
        } else {
          for (const [index, raw] of rawRelations.entries()) {
            const label = `${file}: relation ${index + 1}`
            if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
              issues.push(`${label} must be a mapping`)
              continue
            }
            const item = raw as Record<string, unknown>
            rejectUnknownKeys(item, ['entity', 'verb', 'cardinality'], issues, label)
            const entity = stringField(item, 'entity', issues, label) || ''
            const verb = stringField(item, 'verb', issues, label) || ''
            const cardinality = stringField(item, 'cardinality', issues, label) || ''
            if (!entity) issues.push(`${label}: needs an "entity"`)
            if (!verb) issues.push(`${label}: needs a "verb"`)
            if (cardinality === 'many-to-one') {
              // One 1:N, one encoding: the side that has one of the other declares it.
              issues.push(`${label}: "cardinality" is many-to-one; declare this relation on "${entity}", where it reads one-to-many`)
              continue
            }
            if (!ENTITY_CARDINALITIES.has(cardinality)) {
              issues.push(`${label}: "cardinality" must be one-to-one, one-to-many, or many-to-many`)
              continue
            }
            relations.push({ entity, verb, cardinality: cardinality as EntityCardinality })
          }
        }
      }

      const stateNames = new Set(states.map(state => state.title))
      const transitions: EntityStateTransition[] = []
      const rawTransitions = data.transitions
      if (hasStates && (rawTransitions === undefined || rawTransitions === null)) {
        issues.push(`${file}: an Entity with "## States" needs "transitions"`)
      }
      if (!hasStates && rawTransitions !== undefined && rawTransitions !== null) {
        issues.push(`${file}: "transitions" needs "## States" to move between`)
      }
      if (Array.isArray(rawTransitions)) {
        for (const [index, raw] of rawTransitions.entries()) {
          const label = `${file}: transition ${index + 1}`
          if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
            issues.push(`${label} must be a mapping`)
            continue
          }
          const item = raw as Record<string, unknown>
          rejectUnknownKeys(item, ['from', 'to', 'by'], issues, label)
          const from = stringField(item, 'from', issues, label) || ''
          const to = stringField(item, 'to', issues, label) || ''
          const by = stringField(item, 'by', issues, label) || ''
          for (const name of [from, to]) {
            if (name && !stateNames.has(name)) issues.push(`${label}: names unknown state "${name}"`)
          }
          if (!by) issues.push(`${label}: needs "by", the Capability that causes it`)
          transitions.push({ from, to, by })
        }
        if (hasStates && !transitions.length) issues.push(`${file}: "transitions" needs at least one transition`)
      } else if (rawTransitions !== undefined && rawTransitions !== null) {
        issues.push(`${file}: "transitions" must be a list`)
      }

      const reachable = new Set(transitions.map(transition => transition.to))
      for (const state of states.slice(1)) {
        if (!reachable.has(state.title)) {
          notices.push(`${file}: no transition reaches state "${state.title}"`)
        }
      }
      return {
        id, file, doc, references, directory, assets, assetMeta,
        domain: stringField(data, 'domain', issues, file),
        informationKept,
        relations,
        states,
        transitions
      }
    })

  const capabilities: CapabilityResource[] = []
  const capabilityScenarios: CapabilityScenarioResource[] = []
  for (const location of listResources(
    join(root, 'capabilities'),
    'capability',
    findings,
    'capabilities',
    ['scenarios']
  )) {
    const { data, doc, references, directory, assets, assetMeta } = readResource(location, ['domain', 'entities', 'availability'], issues)
    capabilities.push({
      entities: uniqueStringListField(data, 'entities', issues, location.file),
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
    for (const scenario of listResources(
      join(location.directory, 'scenarios'),
      'capability-scenario',
      findings,
      `capabilities/${location.id}/scenarios`
    )) {
      const parsed = readResource(scenario, ['kind', 'routes', 'steps'], issues)
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
        routes: scenarioRoutesField(parsed.data, issues, scenario.file),
        steps: scenarioStepsField(parsed.data, issues, scenario.file, false),
        ...readScenarioSections(parsed.doc, issues, scenario.file)
      })
    }
  }

  const journeys: JourneyResource[] = []
  const journeyScenarios: JourneyScenarioResource[] = []
  for (const location of listResources(
    join(root, 'journeys'),
    'journey',
    findings,
    'journeys',
    ['scenarios']
  )) {
    const { data, doc, references, directory, assets, assetMeta } = readResource(location, ['actors'], issues)
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
    for (const scenario of listResources(
      join(location.directory, 'scenarios'),
      'journey-scenario',
      findings,
      `journeys/${location.id}/scenarios`
    )) {
      const parsed = readResource(scenario, ['kind', 'result', 'routes', 'steps'], issues)
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
        result: stringField(parsed.data, 'result', issues, scenario.file) || '',
        routes: scenarioRoutesField(parsed.data, issues, scenario.file),
        steps: scenarioStepsField(parsed.data, issues, scenario.file, true),
        ...readScenarioSections(parsed.doc, issues, scenario.file)
      })
    }
  }

  const businessRules: BusinessRuleResource[] = listResources(
    join(root, 'business-rules'),
    'business-rule',
    findings,
    'business-rules'
  ).map((location) => {
    const { id, file } = location
    const { data, doc, references, directory, assets, assetMeta } = readResource(location, ['appliesTo'], issues)
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
    entities,
    capabilities,
    capabilityScenarios,
    businessRules,
    journeys,
    journeyScenarios,
    issues,
    notices
  }
}
