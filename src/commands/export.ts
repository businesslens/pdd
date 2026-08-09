import type { EntityFile, PddModel } from '../core/model.js'
import type { Availability } from '../core/frontmatter.js'
import type { ProductReportV8 } from '../core/portable.js'
import { writeGeneratedFile } from '../core/generated-files.js'
import { lsFiles } from '../core/git.js'
import { section, supportingContent } from '../core/markdown.js'
import { loadModel } from '../core/model.js'
import { resolveModelRoot, type ModelRoot } from '../core/model-root.js'
import {
  ProductReportV8Schema,
  REPORT_SCHEMA_VERSION,
  projectPortableReport,
  validateProductReport
} from '../core/portable.js'
import { cliVersion } from '../version.js'
import { lintModel } from './lint.js'

const byId = <T extends { id: string }>(items: T[]): T[] => [...items].sort((a, b) => a.id.localeCompare(b.id))
const sorted = (items: string[]): string[] => [...items].sort()
const availability = (items: Availability[]) => [...items]
  .sort((a, b) => a.interface.localeCompare(b.interface))
  .map(item => ({ interfaceId: item.interface, experienceIds: sorted(item.experiences) }))

function entityContent(entity: EntityFile, recognized: string[]) {
  return {
    intent: section(entity.doc, 'Intent') || '',
    supportingContent: supportingContent(entity.doc, ['Intent', ...recognized]),
    references: entity.references.map(reference => ({
      kind: reference.kind,
      role: reference.role,
      target: reference.target,
      ...(reference.title ? { title: reference.title } : {})
    }))
  }
}

/**
 * Compile a linted model into a workspace Product Report, references intact.
 *
 * The pure compiler. `buildProject` projects what this returns before writing
 * it, so a delivered Blueprint carries only portable references.
 */
export function compileReport(
  model: PddModel,
  today: string
): ProductReportV8 {
  const capabilityById = new Map(model.capabilities.map(capability => [capability.id, capability]))
  const journeyScenariosByJourney = new Map(model.journeys.map(journey => [
    journey.id,
    model.journeyScenarios.filter(scenario => scenario.journey === journey.id)
  ]))

  const report: ProductReportV8 = {
    schemaVersion: REPORT_SCHEMA_VERSION,
    id: model.product.id,
    title: model.product.doc.title,
    summary: model.product.summary || model.product.doc.lead,
    description: model.product.doc.lead,
    category: model.product.category ?? null,
    authors: model.product.authors,
    license: model.product.license ?? null,
    intent: section(model.product.doc, 'Intent') || '',
    supportingContent: supportingContent(model.product.doc, ['Intent']),
    references: model.product.references.map(reference => ({
      kind: reference.kind,
      role: reference.role,
      target: reference.target,
      ...(reference.title ? { title: reference.title } : {})
    })),
    referenceProfile: 'workspace',
    tags: sorted(model.product.tags),
    generatedAt: today,
    generator: { name: 'businesslens-cli', version: cliVersion() },
    counts: {
      actors: model.actors.length,
      interfaces: model.interfaces.length,
      experiences: model.experiences.length,
      screens: model.screens.length,
      domains: model.domains.length,
      capabilities: model.capabilities.length,
      capabilityScenarios: model.capabilityScenarios.length,
      journeys: model.journeys.length,
      journeyScenarios: model.journeyScenarios.length,
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
        kind: actor.kind as 'person' | 'system',
        relationship: actor.relationship as 'external' | 'internal',
        ...entityContent(actor, [])
      })),
      interfaces: byId(model.interfaces).map(productInterface => ({
        id: productInterface.id,
        title: productInterface.doc.title,
        description: productInterface.doc.lead,
        actorIds: sorted(productInterface.actors),
        entryPoints: productInterface.entryPoints,
        capabilityBoundary: productInterface.capabilityBoundary,
        ...entityContent(productInterface, ['Capability boundary'])
      })),
      experiences: byId(model.experiences).map(experience => ({
        id: experience.id,
        title: experience.doc.title,
        description: experience.doc.lead,
        actorIds: sorted(experience.actors),
        interfaceIds: sorted(experience.interfaces),
        accessMode: experience.access as 'public' | 'authenticated' | 'restricted',
        entryPoints: experience.entryPoints,
        capabilityBoundary: experience.capabilityBoundary,
        ...entityContent(experience, ['Capability boundary'])
      })),
      screens: byId(model.screens).map(screen => ({
        id: screen.id,
        title: screen.doc.title,
        description: screen.doc.lead,
        availability: availability(screen.availability),
        capabilityIds: sorted(screen.capabilities),
        capabilityScenarioIds: sorted(screen.capabilityScenarios),
        journeyScenarioIds: sorted(screen.journeyScenarios),
        entryPoints: screen.entryPoints,
        information: screen.information,
        actions: screen.actions,
        states: screen.states,
        capabilityBoundary: screen.capabilityBoundary,
        ...entityContent(screen, ['Information presented', 'Available actions', 'Product states', 'Capability boundary'])
      })),
      domains: byId(model.domains).map(domain => ({
        id: domain.id,
        name: domain.doc.title,
        description: domain.doc.lead,
        ...(domain.colorSlot !== undefined ? { colorSlot: domain.colorSlot } : {}),
        ...entityContent(domain, [])
      })),
      capabilities: byId(model.capabilities).map(capability => ({
        id: capability.id,
        title: capability.doc.title,
        description: capability.doc.lead,
        ...(capability.domain ? { domainId: capability.domain } : {}),
        availability: availability(capability.availability),
        ...entityContent(capability, [])
      })),
      capabilityScenarios: byId(model.capabilityScenarios).map(scenario => ({
        id: scenario.id,
        capabilityId: scenario.capability,
        title: scenario.doc.title,
        kindId: scenario.kind,
        actorIds: sorted(scenario.actors),
        availability: availability(scenario.availability),
        trigger: scenario.trigger,
        steps: scenario.steps,
        decisionPoints: scenario.decisionPoints,
        outcome: scenario.outcome,
        edgeCases: scenario.edgeCases,
        ...entityContent(scenario, ['Trigger', 'Steps', 'Decision points', 'Outcome', 'Edge cases'])
      })),
      journeys: byId(model.journeys).map((journey) => {
        const scenarios = journeyScenariosByJourney.get(journey.id) || []
        const achievedCapabilityIds = new Set(
          scenarios.filter(scenario => scenario.result === 'achieved').flatMap(scenario => scenario.flow.map(item => item.capability))
        )
        const failedCapabilityIds = new Set(
          scenarios.filter(scenario => scenario.result === 'not-achieved').flatMap(scenario => scenario.flow.map(item => item.capability))
        )
        const failureOnlyCapabilityIds = [...failedCapabilityIds].filter(id => !achievedCapabilityIds.has(id))
        const domainIds = [...achievedCapabilityIds]
          .map(id => capabilityById.get(id)?.domain)
          .filter((id): id is string => Boolean(id))
        return {
          id: journey.id,
          title: journey.doc.title,
          goal: journey.goal,
          successCriterion: journey.successCriterion,
          actorIds: sorted(journey.actors),
          capabilityIds: sorted([...achievedCapabilityIds]),
          failureOnlyCapabilityIds: sorted(failureOnlyCapabilityIds),
          domainIds: sorted([...new Set(domainIds)]),
          ...entityContent(journey, ['Goal', 'Success criterion'])
        }
      }),
      journeyScenarios: byId(model.journeyScenarios).map(scenario => ({
        id: scenario.id,
        journeyId: scenario.journey,
        title: scenario.doc.title,
        kindId: scenario.kind,
        actorIds: sorted(scenario.actors),
        result: scenario.result as 'achieved' | 'not-achieved',
        flow: scenario.flow.map(item => ({
          capabilityId: item.capability,
          operation: item.operation,
          availability: availability(item.availability)
        })),
        trigger: scenario.trigger,
        steps: scenario.steps,
        decisionPoints: scenario.decisionPoints,
        outcome: scenario.outcome,
        edgeCases: scenario.edgeCases,
        ...entityContent(scenario, ['Trigger', 'Steps', 'Decision points', 'Outcome', 'Edge cases'])
      })),
      businessRules: byId(model.businessRules).map(rule => ({
        id: rule.id,
        title: rule.doc.title,
        statement: rule.doc.lead,
        rationale: rule.rationale,
        domainIds: sorted(rule.domains),
        capabilityIds: sorted(rule.capabilities),
        journeyIds: sorted(rule.journeys),
        capabilityScenarioIds: sorted(rule.capabilityScenarios),
        journeyScenarioIds: sorted(rule.journeyScenarios),
        availability: availability(rule.availability),
        ...entityContent(rule, ['Rationale'])
      }))
    },
    coverage: {
      status: model.coverage.status as 'complete' | 'partial' | 'draft',
      method: model.coverage.method,
      sourceAreas: model.coverage.sourceAreas,
      unmapped: model.coverage.unmapped,
      limitations: model.coverage.limitations,
      rationale: model.coverage.rationale
    }
  }

  const parsed = ProductReportV8Schema.parse(report)
  const issues = validateProductReport(parsed)
  if (issues.length) throw new Error(`Report validation failed:\n- ${issues.join('\n- ')}`)
  return parsed
}

export interface BuildOutcome {
  report: ProductReportV8
  outputFile: string
}

/** Compile the current workspace without writing generated artifacts. */
export function compileWorkspaceReport(cwd: string): ProductReportV8 {
  return compileResolvedWorkspaceReport(resolveModelRoot(cwd))
}

/** Compile a model whose ownership boundary has already been resolved. */
export function compileResolvedWorkspaceReport({ modelRoot, gitRoot }: ModelRoot): ProductReportV8 {
  const model = loadModel(modelRoot)
  const tracked = gitRoot ? lsFiles(gitRoot) : []
  const result = lintModel(model, tracked)
  if (!result.ok) {
    throw new Error(`Lint failed:\n${result.errors.map(error => `- ${error}`).join('\n')}`)
  }
  const today = new Date().toISOString().slice(0, 10)
  return compileReport(model, today)
}

export function buildProject(cwd: string): BuildOutcome {
  const resolved = resolveModelRoot(cwd)
  // Export emits the portable profile. Source navigation belongs to this
  // workspace and would be misleading in a Blueprint opened elsewhere.
  const report = projectPortableReport(compileResolvedWorkspaceReport(resolved))

  const outputFile = writeGeneratedFile(
    resolved.modelRoot,
    ['.businesslens', 'build', 'report.json'],
    `${JSON.stringify(report, null, 2)}\n`
  )
  writeGeneratedFile(
    resolved.modelRoot,
    ['.businesslens', 'cache', 'build.json'],
    `${JSON.stringify({ builtAt: new Date().toISOString(), schemaVersion: REPORT_SCHEMA_VERSION }, null, 2)}\n`
  )
  return { report, outputFile }
}

export function runExport(cwd: string): number {
  try {
    const { outputFile } = buildProject(cwd)
    console.log(`Exported Blueprint to ${outputFile}.`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
}
