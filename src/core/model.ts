import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import type { CodeRef } from './coderefs.js'
import type { CompactEntryPoint, EntityLink } from './frontmatter.js'
import type { MarkdownDoc } from './markdown.js'
import { parseCodeRef } from './coderefs.js'
import {
  entryPointsField, linksField, rejectUnknownKeys, splitFrontmatter, stringField, stringListField
} from './frontmatter.js'
import { stem } from './ids.js'
import {
  bulletList, decisionPoints, orderedList, parseMarkdown, section
} from './markdown.js'

export interface EntityFile {
  id: string
  file: string
  doc: MarkdownDoc
  codeRefs: CodeRef[]
  links: EntityLink[]
}

export interface ActorEntity extends EntityFile {}
export interface DomainEntity extends EntityFile { colorSlot?: number }
export interface ExperienceEntity extends EntityFile {
  actors: string[]
  access: string
  entryPoints: CompactEntryPoint[]
  exit: string
  capabilities: string
}
export interface FeatureEntity extends EntityFile {
  domain: string
  actors: string[]
  experiences: string[]
  businessRules: string[]
}
export interface ScenarioEntity extends EntityFile {
  journeyId: string
  kind: string
  trigger: string
  steps: string[]
  outcome: string
  edgeCases: string[]
  businessRules: string[]
  decisionPoints: ReturnType<typeof decisionPoints>
}
export interface JourneyEntity extends EntityFile {
  domain: string
  actors: string[]
  experiences: string[]
  features: string[]
  entryPoints: CompactEntryPoint[]
  scenarios: ScenarioEntity[]
}
export interface BusinessRuleEntity extends EntityFile {
  domains: string[]
  features: string[]
  journeys: string[]
  scenarios: string[]
  rationale: string
}

export interface ScenarioKind {
  id: string
  name: string
  description: string
  colorSlot?: number
}

export interface PddModel {
  root: string
  config: { schema: number, sddPaths: string[] }
  product: { id: string, tags: string[], limitations: string[], doc: MarkdownDoc, links: EntityLink[] }
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
  domains: DomainEntity[]
  experiences: ExperienceEntity[]
  features: FeatureEntity[]
  businessRules: BusinessRuleEntity[]
  journeys: JourneyEntity[]
  issues: string[]
}

export const FOLDER = '.businesslens'

function listMarkdown(directory: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory).filter(name => name.endsWith('.md')).sort()
}

function listDirectories(directory: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
}

function codeRefsField(data: Record<string, unknown>, issues: string[], label: string): CodeRef[] {
  const raw = stringListField(data, 'codeRefs', issues, label)
  return raw.map(value => parseCodeRef(value, issues, label)).filter((ref): ref is CodeRef => Boolean(ref))
}

function readEntity(file: string, allowedKeys: string[], issues: string[]): { data: Record<string, unknown>, doc: MarkdownDoc, codeRefs: CodeRef[], links: EntityLink[] } {
  const source = readFileSync(file, 'utf8')
  const { data, body } = splitFrontmatter(source, issues, file)
  rejectUnknownKeys(data, [...allowedKeys, 'links', 'codeRefs'], issues, file)
  const doc = parseMarkdown(body)
  return { data, doc, codeRefs: codeRefsField(data, issues, file), links: linksField(data, issues, file) }
}

/** Load the whole .businesslens/ folder into memory, collecting parse issues. */
export function loadModel(cwd: string): PddModel {
  const root = join(cwd, FOLDER)
  const issues: string[] = []
  if (!existsSync(root)) {
    issues.push(`${FOLDER}/ does not exist — invoke the \`businesslens-init\` skill first`)
  }

  let config = { schema: 1, sddPaths: [] as string[] }
  const configFile = join(root, 'config.yaml')
  if (existsSync(configFile)) {
    try {
      const raw = parse(readFileSync(configFile, 'utf8')) as Record<string, any> | null
      config = {
        schema: Number(raw?.schema ?? 1),
        sddPaths: Array.isArray(raw?.sdd?.paths) ? raw.sdd.paths.map(String) : []
      }
    } catch (error) {
      issues.push(`config.yaml failed to parse (${(error as Error).message})`)
    }
  } else if (existsSync(root)) {
    issues.push('config.yaml is missing')
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

  let product: PddModel['product'] = { id: '', tags: [], limitations: [], doc: { title: '', lead: '', sections: [] }, links: [] }
  const productFile = join(root, 'product.md')
  if (existsSync(productFile)) {
    const source = readFileSync(productFile, 'utf8')
    const { data, body } = splitFrontmatter(source, issues, 'product.md')
    rejectUnknownKeys(data, ['id', 'tags', 'limitations', 'links'], issues, 'product.md')
    product = {
      id: stringField(data, 'id', issues, 'product.md') || '',
      tags: stringListField(data, 'tags', issues, 'product.md'),
      limitations: stringListField(data, 'limitations', issues, 'product.md'),
      doc: parseMarkdown(body),
      links: linksField(data, issues, 'product.md')
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
    rejectUnknownKeys(data, ['status', 'method', 'sourceAreas', 'unmapped', 'limitations', 'links'], issues, 'coverage.md')
    coverage = {
      status: stringField(data, 'status', issues, 'coverage.md') || 'draft',
      method: stringListField(data, 'method', issues, 'coverage.md'),
      sourceAreas: stringListField(data, 'sourceAreas', issues, 'coverage.md'),
      unmapped: stringListField(data, 'unmapped', issues, 'coverage.md'),
      limitations: stringListField(data, 'limitations', issues, 'coverage.md'),
      rationale: parseMarkdown(body).lead
    }
  } else if (existsSync(root)) {
    issues.push('coverage.md is missing')
  }

  const actors: ActorEntity[] = listMarkdown(join(root, 'actors')).map((name) => {
    const file = join(root, 'actors', name)
    const { doc, codeRefs, links } = readEntity(file, [], issues)
    return { id: stem(name), file, doc, codeRefs, links }
  })

  const domains: DomainEntity[] = listMarkdown(join(root, 'domains')).map((name) => {
    const file = join(root, 'domains', name)
    const { data, doc, codeRefs, links } = readEntity(file, ['colorSlot'], issues)
    return {
      id: stem(name), file, doc, codeRefs, links,
      colorSlot: typeof data.colorSlot === 'number' ? data.colorSlot : undefined
    }
  })

  const experiences: ExperienceEntity[] = listMarkdown(join(root, 'experiences')).map((name) => {
    const file = join(root, 'experiences', name)
    const { data, doc, codeRefs, links } = readEntity(file, ['actors', 'access', 'entryPoints', 'exit'], issues)
    return {
      id: stem(name), file, doc, codeRefs, links,
      actors: stringListField(data, 'actors', issues, file),
      access: stringField(data, 'access', issues, file) || '',
      entryPoints: entryPointsField(data, issues, file),
      exit: stringField(data, 'exit', issues, file) || '',
      capabilities: section(doc, 'Capability boundary') || ''
    }
  })

  const features: FeatureEntity[] = listMarkdown(join(root, 'features')).map((name) => {
    const file = join(root, 'features', name)
    const { data, doc, codeRefs, links } = readEntity(
      file,
      ['domain', 'actors', 'experiences', 'businessRules'],
      issues
    )
    return {
      id: stem(name),
      file,
      doc,
      codeRefs,
      links,
      domain: stringField(data, 'domain', issues, file) || '',
      actors: stringListField(data, 'actors', issues, file),
      experiences: stringListField(data, 'experiences', issues, file),
      businessRules: stringListField(data, 'businessRules', issues, file)
    }
  })

  const businessRules: BusinessRuleEntity[] = listMarkdown(join(root, 'business-rules')).map((name) => {
    const file = join(root, 'business-rules', name)
    const { data, doc, codeRefs, links } = readEntity(
      file,
      ['domains', 'features', 'journeys', 'scenarios'],
      issues
    )
    return {
      id: stem(name),
      file,
      doc,
      codeRefs,
      links,
      domains: stringListField(data, 'domains', issues, file),
      features: stringListField(data, 'features', issues, file),
      journeys: stringListField(data, 'journeys', issues, file),
      scenarios: stringListField(data, 'scenarios', issues, file),
      rationale: section(doc, 'Rationale') || ''
    }
  })

  const journeys: JourneyEntity[] = listDirectories(join(root, 'journeys')).map((journeyId) => {
    const journeyDir = join(root, 'journeys', journeyId)
    const file = join(journeyDir, 'journey.md')
    if (!existsSync(file)) {
      issues.push(`journeys/${journeyId}/ is missing journey.md`)
      return null
    }
    const { data, doc, codeRefs, links } = readEntity(
      file,
      ['domain', 'actors', 'experiences', 'features', 'entryPoints'],
      issues
    )
    const scenarios: ScenarioEntity[] = listMarkdown(join(journeyDir, 'scenarios')).map((scenarioName) => {
      const scenarioFile = join(journeyDir, 'scenarios', scenarioName)
      const entity = readEntity(scenarioFile, ['kind', 'businessRules'], issues)
      const scenarioDoc = entity.doc
      return {
        id: stem(scenarioName),
        file: scenarioFile,
        doc: scenarioDoc,
        codeRefs: entity.codeRefs,
        links: entity.links,
        journeyId,
        kind: stringField(entity.data, 'kind', issues, scenarioFile) || '',
        trigger: section(scenarioDoc, 'Trigger') || '',
        steps: orderedList(section(scenarioDoc, 'Steps') || ''),
        outcome: section(scenarioDoc, 'Outcome') || '',
        edgeCases: bulletList(section(scenarioDoc, 'Edge cases') || ''),
        businessRules: stringListField(entity.data, 'businessRules', issues, scenarioFile),
        decisionPoints: decisionPoints(section(scenarioDoc, 'Decision points') || '', issues, scenarioFile)
      }
    })
    return {
      id: journeyId, file, doc, codeRefs, links,
      domain: stringField(data, 'domain', issues, file) || '',
      actors: stringListField(data, 'actors', issues, file),
      experiences: stringListField(data, 'experiences', issues, file),
      features: stringListField(data, 'features', issues, file),
      entryPoints: entryPointsField(data, issues, file),
      scenarios
    }
  }).filter((journey): journey is JourneyEntity => Boolean(journey))

  return {
    root,
    config,
    product,
    scenarioKinds,
    coverage,
    actors,
    domains,
    experiences,
    features,
    businessRules,
    journeys,
    issues
  }
}
