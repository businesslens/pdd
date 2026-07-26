import type { PddModel } from '../core/model.js'
import type { PortableProjectV3 } from '../core/portable.js'
import type { Provenance } from '../core/git.js'
import { writeGeneratedFile } from '../core/generated-files.js'
import { lsFiles, provenance, repoRoot } from '../core/git.js'
import { loadModel } from '../core/model.js'
import { PortableProjectV3Schema } from '../core/portable.js'
import { validateModel } from './validate.js'
import { cliVersion } from '../version.js'

const byId = <T extends { id: string }>(items: T[]): T[] => [...items].sort((a, b) => a.id.localeCompare(b.id))

/** Compile a validated model + pinned provenance into the portable document. */
export function compileProject(model: PddModel, pinned: Provenance, trackedFileCount: number, today: string): PortableProjectV3 {
  const scenarios = model.journeys.flatMap(journey => journey.scenarios)
  const mappedCount = (items: Array<{ codeRefs: unknown[] }>) => items.filter(item => item.codeRefs.length > 0).length

  const document: PortableProjectV3 = {
    schemaVersion: '3.0.0',
    id: model.product.id,
    title: model.product.doc.title,
    description: model.product.doc.lead,
    tags: model.product.tags,
    generatedAt: today,
    source: {
      repository: pinned.repository,
      repositoryUrl: pinned.repositoryUrl,
      branch: pinned.branch,
      commit: pinned.commit,
      committedAt: pinned.committedAt,
      analyzedAt: today
    },
    generator: { name: 'businesslens-cli', version: cliVersion() },
    summary: {
      actors: model.actors.length,
      experiences: model.experiences.length,
      domains: model.domains.length,
      journeys: model.journeys.length,
      scenarios: scenarios.length
    },
    limitations: model.product.limitations,
    model: {
      taxonomies: {
        scenarioKinds: byId(model.scenarioKinds).map(kind => ({
          id: kind.id, name: kind.name, description: kind.description,
          ...(kind.colorSlot !== undefined ? { colorSlot: kind.colorSlot } : {})
        }))
      },
      actors: byId(model.actors).map(actor => ({
        id: actor.id, name: actor.doc.title, description: actor.doc.lead,
        codeRefs: actor.codeRefs
      })),
      experiences: byId(model.experiences).map(experience => ({
        id: experience.id,
        title: experience.doc.title,
        description: experience.doc.lead,
        actorIds: [...experience.actors].sort(),
        accessMode: experience.access as 'public' | 'authenticated' | 'restricted',
        capabilities: experience.capabilities,
        entryPoints: experience.entryPoints,
        exitContract: experience.exit,
        codeRefs: experience.codeRefs
      })),
      domains: byId(model.domains).map(domain => ({
        id: domain.id, name: domain.doc.title, description: domain.doc.lead,
        ...(domain.colorSlot !== undefined ? { colorSlot: domain.colorSlot } : {}),
        codeRefs: domain.codeRefs
      })),
      journeys: byId(model.journeys).map(journey => ({
        id: journey.id,
        title: journey.doc.title,
        summary: journey.doc.lead,
        domainId: journey.domain,
        actorIds: [...journey.actors].sort(),
        experienceIds: [...journey.experiences].sort(),
        entryPoints: journey.entryPoints,
        codeRefs: journey.codeRefs
      })),
      scenarios: byId(scenarios).map(scenario => ({
        id: scenario.id,
        journeyId: scenario.journeyId,
        title: scenario.doc.title,
        kindId: scenario.kind,
        trigger: scenario.trigger,
        steps: scenario.steps,
        outcome: scenario.outcome,
        edgeCases: scenario.edgeCases,
        codeRefs: scenario.codeRefs
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
        journeys: model.journeys.length,
        scenarios: scenarios.length
      },
      mapped: {
        actors: mappedCount(model.actors),
        experiences: mappedCount(model.experiences),
        domains: mappedCount(model.domains),
        journeys: mappedCount(model.journeys),
        scenarios: mappedCount(scenarios)
      },
      unmapped: model.coverage.unmapped,
      limitations: model.coverage.limitations
    }
  }
  return PortableProjectV3Schema.parse(document)
}

export interface BuildOutcome {
  project: PortableProjectV3
  outputFile: string
}

export function buildProject(cwd: string): BuildOutcome {
  const root = repoRoot(cwd)
  const model = loadModel(root)
  const tracked = lsFiles(root)
  const result = validateModel(model, tracked)
  if (!result.ok) {
    throw new Error(`Validation failed:\n${result.errors.map(error => `- ${error}`).join('\n')}`)
  }
  const pinned = provenance(root)
  const today = new Date().toISOString().slice(0, 10)
  const project = compileProject(model, pinned, tracked.length, today)

  const outputFile = writeGeneratedFile(
    root,
    ['.businesslens', 'build', 'project.json'],
    `${JSON.stringify(project, null, 2)}\n`
  )
  writeGeneratedFile(
    root,
    ['.businesslens', 'cache', 'build.json'],
    `${JSON.stringify({ commit: pinned.commit, builtAt: new Date().toISOString() }, null, 2)}\n`
  )
  return { project, outputFile }
}

export function runBuild(cwd: string): number {
  try {
    const { project, outputFile } = buildProject(cwd)
    const { summary } = project
    console.log(`Compiled ${summary.actors} actors, ${summary.experiences} experiences, ${summary.domains} domains, ${summary.journeys} journeys, ${summary.scenarios} scenarios.`)
    console.log(`Wrote ${outputFile} (commit ${project.source.commit.slice(0, 12)}, branch ${project.source.branch}).`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
}
