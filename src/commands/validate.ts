import type { PddModel } from '../core/model.js'
import { lsFiles } from '../core/git.js'
import { isId } from '../core/ids.js'
import { loadModel } from '../core/model.js'
import { resolveModelRoot } from '../core/model-root.js'

export interface ValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  counts: Record<string, number>
}

const ACCESS_MODES = new Set(['public', 'authenticated', 'restricted'])
const COVERAGE_STATUSES = new Set(['complete', 'partial', 'draft'])

/** Pure rule engine over a loaded model; trackedFiles injected for testability. */
export function validateModel(model: PddModel, trackedFiles: string[]): ValidationResult {
  const errors = [...model.issues]
  const warnings: string[] = []
  const tracked = new Set(trackedFiles)

  const requireTitle = (label: string, title: string, lead: string) => {
    if (!title) errors.push(`${label}: missing H1 title`)
    if (!lead) errors.push(`${label}: missing lead paragraph (description)`)
  }

  // A draft model is planned, not yet implemented: missing evidence is a
  // warning until coverage leaves draft, when it becomes an error again.
  const draft = model.coverage.status === 'draft'
  const requireEvidence = (label: string) => {
    if (draft) warnings.push(`${label}: needs at least one codeRef before coverage can leave draft`)
    else errors.push(`${label}: needs at least one codeRef`)
  }

  if (model.product.id && !isId(model.product.id)) errors.push('product.md: id must be lowercase kebab-case')
  if (model.product.id.length > 64) errors.push('product.md: id must be at most 64 characters')
  if (!model.product.id) errors.push('product.md: missing id')
  requireTitle('product.md', model.product.doc.title, model.product.doc.lead)

  if (!COVERAGE_STATUSES.has(model.coverage.status)) {
    errors.push(`coverage.md: status "${model.coverage.status}" must be complete|partial|draft`)
  }

  const collections: Array<[string, Array<{ id: string }>]> = [
    ['actors', model.actors],
    ['experiences', model.experiences],
    ['domains', model.domains],
    ['features', model.features],
    ['businessRules', model.businessRules],
    ['journeys', model.journeys],
    ['scenarioKinds', model.scenarioKinds]
  ]
  for (const [name, items] of collections) {
    for (const item of items) {
      if (!isId(item.id)) errors.push(`${name}: id "${item.id}" must be lowercase kebab-case`)
    }
  }

  const actorIds = new Set(model.actors.map(actor => actor.id))
  const experienceIds = new Set(model.experiences.map(experience => experience.id))
  const domainIds = new Set(model.domains.map(domain => domain.id))
  const featureIds = new Set(model.features.map(feature => feature.id))
  const businessRuleIds = new Set(model.businessRules.map(rule => rule.id))
  const journeyIds = new Set(model.journeys.map(journey => journey.id))
  const scenarioIds = new Set(model.journeys.flatMap(journey => journey.scenarios).map(scenario => scenario.id))
  const kindIds = new Set(model.scenarioKinds.map(kind => kind.id))

  for (const actor of model.actors) requireTitle(actor.file, actor.doc.title, actor.doc.lead)
  for (const domain of model.domains) requireTitle(domain.file, domain.doc.title, domain.doc.lead)

  for (const experience of model.experiences) {
    requireTitle(experience.file, experience.doc.title, experience.doc.lead)
    if (!ACCESS_MODES.has(experience.access)) {
      errors.push(`${experience.file}: access "${experience.access}" must be public|authenticated|restricted`)
    }
    if (!experience.actors.length) errors.push(`${experience.file}: needs at least one actor`)
    for (const actorId of experience.actors) {
      if (!actorIds.has(actorId)) errors.push(`${experience.file}: references missing actor "${actorId}"`)
    }
  }

  for (const feature of model.features) {
    requireTitle(feature.file, feature.doc.title, feature.doc.lead)
    if (!feature.domain || !domainIds.has(feature.domain)) {
      errors.push(`${feature.file}: references missing domain "${feature.domain}"`)
    }
    for (const actorId of feature.actors) {
      if (!actorIds.has(actorId)) errors.push(`${feature.file}: references missing actor "${actorId}"`)
    }
    if (!feature.experiences.length) errors.push(`${feature.file}: needs at least one experience`)
    for (const experienceId of feature.experiences) {
      if (!experienceIds.has(experienceId)) errors.push(`${feature.file}: references missing experience "${experienceId}"`)
    }
    for (const ruleId of feature.businessRules) {
      if (!businessRuleIds.has(ruleId)) errors.push(`${feature.file}: references missing business rule "${ruleId}"`)
    }
  }

  const seenScenarioIds = new Map<string, string>()
  for (const journey of model.journeys) {
    const label = journey.file
    requireTitle(label, journey.doc.title, journey.doc.lead)
    if (!journey.domain || !domainIds.has(journey.domain)) {
      errors.push(`${label}: references missing domain "${journey.domain}"`)
    }
    if (!journey.actors.length) errors.push(`${label}: needs at least one actor`)
    for (const actorId of journey.actors) {
      if (!actorIds.has(actorId)) errors.push(`${label}: references missing actor "${actorId}"`)
    }
    if (!journey.experiences.length) errors.push(`${label}: must belong to at least one experience`)
    for (const experienceId of journey.experiences) {
      if (!experienceIds.has(experienceId)) errors.push(`${label}: references missing experience "${experienceId}"`)
    }
    if (!journey.features.length) errors.push(`${label}: must belong to at least one feature`)
    for (const featureId of journey.features) {
      if (!featureIds.has(featureId)) errors.push(`${label}: references missing feature "${featureId}"`)
    }
    if (!journey.codeRefs.length) requireEvidence(label)
    if (!journey.scenarios.length) errors.push(`${label}: needs at least one scenario`)

    for (const scenario of journey.scenarios) {
      const scenarioLabel = scenario.file
      if (!isId(scenario.id)) errors.push(`${scenarioLabel}: id must be lowercase kebab-case`)
      const previous = seenScenarioIds.get(scenario.id)
      if (previous) errors.push(`${scenarioLabel}: scenario id "${scenario.id}" already used in ${previous} (ids are global)`)
      seenScenarioIds.set(scenario.id, journey.id)
      if (!scenario.doc.title) errors.push(`${scenarioLabel}: missing H1 title`)
      if (!scenario.kind || !kindIds.has(scenario.kind)) {
        errors.push(`${scenarioLabel}: kind "${scenario.kind}" is not defined in taxonomies.yaml`)
      }
      if (!scenario.trigger) errors.push(`${scenarioLabel}: missing "## Trigger" section`)
      if (!scenario.steps.length) errors.push(`${scenarioLabel}: "## Steps" needs at least one ordered item`)
      if (!scenario.outcome) errors.push(`${scenarioLabel}: missing "## Outcome" section`)
      for (const ruleId of scenario.businessRules) {
        if (!businessRuleIds.has(ruleId)) errors.push(`${scenarioLabel}: references missing business rule "${ruleId}"`)
      }
      if (!scenario.codeRefs.length) requireEvidence(scenarioLabel)
    }
  }

  for (const rule of model.businessRules) {
    requireTitle(rule.file, rule.doc.title, rule.doc.lead)
    if (!rule.domains.length && !rule.features.length && !rule.journeys.length && !rule.scenarios.length) {
      errors.push(`${rule.file}: must relate to a domain, feature, journey, or scenario`)
    }
    for (const domainId of rule.domains) {
      if (!domainIds.has(domainId)) errors.push(`${rule.file}: references missing domain "${domainId}"`)
    }
    for (const featureId of rule.features) {
      if (!featureIds.has(featureId)) errors.push(`${rule.file}: references missing feature "${featureId}"`)
    }
    for (const journeyId of rule.journeys) {
      if (!journeyIds.has(journeyId)) errors.push(`${rule.file}: references missing journey "${journeyId}"`)
    }
    for (const scenarioId of rule.scenarios) {
      if (!scenarioIds.has(scenarioId)) errors.push(`${rule.file}: references missing scenario "${scenarioId}"`)
    }
  }

  if (model.experiences.length === 0) errors.push('experiences/: the model needs at least one experience')

  const allEntities = [
    ...model.actors, ...model.domains, ...model.experiences,
    ...model.features, ...model.businessRules,
    ...model.journeys, ...model.journeys.flatMap(journey => journey.scenarios)
  ]
  for (const entity of allEntities) {
    for (const ref of entity.codeRefs) {
      if (!tracked.has(ref.path)) errors.push(`${entity.file}: codeRef path "${ref.path}" is not a tracked file`)
    }
    for (const link of entity.links) {
      if (!/^https?:\/\//.test(link.href) && !tracked.has(link.href)) {
        warnings.push(`${entity.file}: link href "${link.href}" does not exist in the repository`)
      }
    }
  }

  const scenarios = model.journeys.flatMap(journey => journey.scenarios)
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: {
      actors: model.actors.length,
      experiences: model.experiences.length,
      domains: model.domains.length,
      features: model.features.length,
      journeys: model.journeys.length,
      scenarios: scenarios.length,
      businessRules: model.businessRules.length
    }
  }
}

export function runValidate(cwd: string, json: boolean): number {
  let modelRoot: string
  let gitRoot: string | undefined
  try {
    ({ modelRoot, gitRoot } = resolveModelRoot(cwd))
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
  const model = loadModel(modelRoot)
  // codeRefs are resolved against tracked files, which only a repository has.
  // Outside one the tracked set is empty, so every codeRef is reported unknown.
  const result = validateModel(model, gitRoot ? lsFiles(gitRoot) : [])
  if (json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    for (const error of result.errors) console.error(`error: ${error}`)
    for (const warning of result.warnings) console.warn(`warning: ${warning}`)
    const summary = Object.entries(result.counts).map(([key, value]) => `${value} ${key}`).join(', ')
    console.log(result.ok ? `Product Model is valid (${summary}).` : `Validation failed with ${result.errors.length} error(s).`)
  }
  return result.ok ? 0 : 1
}
