import type { EntityFile, PddModel } from '../core/model.js'
import type { ProductReportV4 } from '../core/portable.js'
import { writeGeneratedFile } from '../core/generated-files.js'
import { lsFiles } from '../core/git.js'
import { section, supportingContent } from '../core/markdown.js'
import { loadModel } from '../core/model.js'
import { resolveModelRoot } from '../core/model-root.js'
import {
  ProductReportV4Schema,
  REPORT_SCHEMA_VERSION,
  redactSourceEvidence,
  validateProductReport
} from '../core/portable.js'
import { cliVersion } from '../version.js'
import { lintModel } from './lint.js'

const byId = <T extends { id: string }>(items: T[]): T[] => [...items].sort((a, b) => a.id.localeCompare(b.id))
const sorted = (items: string[]): string[] => [...items].sort()

function entityContent(entity: EntityFile, recognized: string[]) {
  return {
    intent: section(entity.doc, 'Intent') || '',
    supportingContent: supportingContent(entity.doc, ['Intent', ...recognized]),
    codeRefs: entity.codeRefs,
    links: entity.links.map(link => ({
      rel: link.rel as 'spec' | 'proposal' | 'doc' | 'adr',
      href: link.href,
      ...(link.title ? { title: link.title } : {})
    }))
  }
}

/**
 * Compile a linted model into a Product Report, source bookmarks intact.
 *
 * The pure compiler. `buildProject` redacts what this returns before writing
 * it, so a delivered Blueprint never carries `codeRefs`; this stays unredacted
 * because redaction is what the tests around it need something to remove.
 */
export function compileReport(
  model: PddModel,
  trackedFileCount: number,
  today: string
): ProductReportV4 {
  const scenarios = model.journeys.flatMap(journey => journey.scenarios)
  const mappedCount = (items: Array<{ codeRefs: unknown[] }>) =>
    items.filter(item => item.codeRefs.length > 0).length

  const report: ProductReportV4 = {
    schemaVersion: REPORT_SCHEMA_VERSION,
    id: model.product.id,
    title: model.product.doc.title,
    description: model.product.doc.lead,
    intent: section(model.product.doc, 'Intent') || '',
    supportingContent: supportingContent(model.product.doc, ['Intent']),
    links: model.product.links.map(link => ({
      rel: link.rel as 'spec' | 'proposal' | 'doc' | 'adr',
      href: link.href,
      ...(link.title ? { title: link.title } : {})
    })),
    tags: sorted(model.product.tags),
    generatedAt: today,
    generator: { name: 'businesslens-cli', version: cliVersion() },
    summary: {
      actors: model.actors.length,
      experiences: model.experiences.length,
      domains: model.domains.length,
      features: model.features.length,
      journeys: model.journeys.length,
      scenarios: scenarios.length,
      businessRules: model.businessRules.length
    },
    limitations: model.product.limitations,
    model: {
      taxonomies: {
        scenarioKinds: byId(model.scenarioKinds).map(kind => ({
          id: kind.id,
          name: kind.name,
          description: kind.description,
          ...(kind.colorSlot !== undefined ? { colorSlot: kind.colorSlot } : {})
        }))
      },
      actors: byId(model.actors).map(actor => ({
        id: actor.id,
        name: actor.doc.title,
        description: actor.doc.lead,
        ...entityContent(actor, [])
      })),
      experiences: byId(model.experiences).map(experience => ({
        id: experience.id,
        title: experience.doc.title,
        description: experience.doc.lead,
        actorIds: sorted(experience.actors),
        accessMode: experience.access as 'public' | 'authenticated' | 'restricted',
        capabilities: experience.capabilities,
        entryPoints: experience.entryPoints,
        exitContract: experience.exit,
        ...entityContent(experience, ['Capability boundary'])
      })),
      domains: byId(model.domains).map(domain => ({
        id: domain.id,
        name: domain.doc.title,
        description: domain.doc.lead,
        ...(domain.colorSlot !== undefined ? { colorSlot: domain.colorSlot } : {}),
        ...entityContent(domain, [])
      })),
      features: byId(model.features).map(feature => ({
        id: feature.id,
        title: feature.doc.title,
        description: feature.doc.lead,
        domainId: feature.domain,
        actorIds: sorted(feature.actors),
        experienceIds: sorted(feature.experiences),
        businessRuleIds: sorted(feature.businessRules),
        ...entityContent(feature, [])
      })),
      journeys: byId(model.journeys).map(journey => ({
        id: journey.id,
        title: journey.doc.title,
        summary: journey.doc.lead,
        domainId: journey.domain,
        actorIds: sorted(journey.actors),
        experienceIds: sorted(journey.experiences),
        featureIds: sorted(journey.features),
        entryPoints: journey.entryPoints,
        ...entityContent(journey, [])
      })),
      scenarios: byId(scenarios).map(scenario => ({
        id: scenario.id,
        journeyId: scenario.journeyId,
        title: scenario.doc.title,
        kindId: scenario.kind,
        trigger: scenario.trigger,
        steps: scenario.steps,
        decisionPoints: scenario.decisionPoints,
        outcome: scenario.outcome,
        edgeCases: scenario.edgeCases,
        businessRuleIds: sorted(scenario.businessRules),
        ...entityContent(scenario, ['Trigger', 'Steps', 'Decision points', 'Outcome', 'Edge cases'])
      })),
      businessRules: byId(model.businessRules).map(rule => ({
        id: rule.id,
        title: rule.doc.title,
        statement: rule.doc.lead,
        rationale: rule.rationale,
        domainIds: sorted(rule.domains),
        featureIds: sorted(rule.features),
        journeyIds: sorted(rule.journeys),
        scenarioIds: sorted(rule.scenarios),
        ...entityContent(rule, ['Rationale'])
      }))
    },
    coverage: {
      status: model.coverage.status as 'complete' | 'partial' | 'draft',
      method: model.coverage.method,
      sourceAreas: model.coverage.sourceAreas,
      counts: {
        files: trackedFileCount,
        actors: model.actors.length,
        experiences: model.experiences.length,
        domains: model.domains.length,
        features: model.features.length,
        journeys: model.journeys.length,
        scenarios: scenarios.length,
        businessRules: model.businessRules.length
      },
      mapped: {
        actors: mappedCount(model.actors),
        experiences: mappedCount(model.experiences),
        domains: mappedCount(model.domains),
        features: mappedCount(model.features),
        journeys: mappedCount(model.journeys),
        scenarios: mappedCount(scenarios),
        businessRules: mappedCount(model.businessRules)
      },
      unmapped: model.coverage.unmapped,
      limitations: model.coverage.limitations,
      rationale: model.coverage.rationale
    }
  }

  const parsed = ProductReportV4Schema.parse(report)
  const issues = validateProductReport(parsed)
  if (issues.length) throw new Error(`Report validation failed:\n- ${issues.join('\n- ')}`)
  return parsed
}

export interface BuildOutcome {
  report: ProductReportV4
  outputFile: string
}

export function buildProject(cwd: string): BuildOutcome {
  const { modelRoot: root, gitRoot } = resolveModelRoot(cwd)
  const model = loadModel(root)
  const tracked = gitRoot ? lsFiles(gitRoot) : []
  const result = lintModel(model, tracked)
  if (!result.ok) {
    throw new Error(`Lint failed:\n${result.errors.map(error => `- ${error}`).join('\n')}`)
  }
  const today = new Date().toISOString().slice(0, 10)
  // Export emits the source-free profile: no `codeRefs`, because they name
  // paths in *this* repository and navigate nowhere else. That is the
  // only profile the catalog accepts, and this command exists to feed it.
  // `contribute` and `open` each redacted separately before; doing it once,
  // here, means every consumer gets the same guarantee. See adr/0003 — an
    // source-linked profile is a future top-level `export`, not a flag on this one.
  const report = redactSourceEvidence(compileReport(model, tracked.length, today))

  const outputFile = writeGeneratedFile(
    root,
    ['.businesslens', 'build', 'report.json'],
    `${JSON.stringify(report, null, 2)}\n`
  )
  writeGeneratedFile(
    root,
    ['.businesslens', 'cache', 'build.json'],
    `${JSON.stringify({ builtAt: new Date().toISOString(), schemaVersion: REPORT_SCHEMA_VERSION }, null, 2)}\n`
  )
  return { report, outputFile }
}

export function runExport(cwd: string): number {
  try {
    const { report, outputFile } = buildProject(cwd)
    const { summary } = report
    console.log(
      `Compiled ${summary.actors} actors, ${summary.experiences} experiences, `
      + `${summary.domains} domains, ${summary.features} features, ${summary.journeys} journeys, `
      + `${summary.scenarios} scenarios, and ${summary.businessRules} business rules.`
    )
    console.log(`Wrote ${outputFile}.`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
}
