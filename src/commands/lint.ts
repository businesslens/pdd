import type { Availability } from '../core/frontmatter.js'
import type { PddModel } from '../core/model.js'
import { repositoryReferencePath } from '../core/frontmatter.js'
import { lsFiles } from '../core/git.js'
import { isId } from '../core/ids.js'
import { section } from '../core/markdown.js'
import { loadModel } from '../core/model.js'
import { resolveModelRoot } from '../core/model-root.js'

export interface LintResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  counts: Record<string, number>
}

const ACCESS_MODES = new Set(['public', 'authenticated', 'restricted'])
const ACTOR_KINDS = new Set(['person', 'system'])
const ACTOR_RELATIONSHIPS = new Set(['external', 'internal'])
const COVERAGE_STATUSES = new Set(['complete', 'partial', 'draft'])

function pairKey(interfaceId: string, experienceId: string): string {
  return `${interfaceId}\0${experienceId}`
}

/** Pure structural rule engine over a loaded model; trackedFiles injected for testability. */
export function lintModel(model: PddModel, trackedFiles: string[]): LintResult {
  const errors = [...model.issues]
  const warnings: string[] = []
  const tracked = new Set(trackedFiles)

  const requireTitle = (label: string, title: string, lead: string) => {
    if (!title) errors.push(`${label}: missing H1 title`)
    if (!lead) errors.push(`${label}: missing lead paragraph (description)`)
  }

  if (model.product.id && !isId(model.product.id)) errors.push('product.md: id must be lowercase kebab-case')
  if (model.product.id.length > 64) errors.push('product.md: id must be at most 64 characters')
  if (!model.product.id) errors.push('product.md: missing id')
  requireTitle('product.md', model.product.doc.title, model.product.doc.lead)
  if (model.product.summary && (/\r|\n/.test(model.product.summary) || model.product.summary.length > 400)) {
    errors.push('product.md: summary must be a single line with at most 400 characters')
  }
  if (model.product.category && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(model.product.category)) {
    errors.push('product.md: category must be lowercase kebab-case')
  }
  if (model.product.category && model.product.category.length > 60) {
    errors.push('product.md: category must be at most 60 characters')
  }
  if (model.product.license && !/^[A-Za-z0-9][A-Za-z0-9.+-]*$/.test(model.product.license)) {
    errors.push('product.md: license must be one SPDX license identifier')
  }
  for (const [index, author] of model.product.authors.entries()) {
    if (!author.name.trim() || author.name.length > 120) {
      errors.push(`product.md: author ${index + 1} name must contain 1–120 characters`)
    }
    if (author.url) {
      try {
        const url = new URL(author.url)
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol')
      } catch {
        errors.push(`product.md: author ${index + 1} url must use HTTP(S)`)
      }
    }
  }

  if (!COVERAGE_STATUSES.has(model.coverage.status)) {
    errors.push(`coverage.md: status "${model.coverage.status}" must be complete|partial|draft`)
  }

  const collections: Array<[string, Array<{ id: string }>]> = [
    ['actors', model.actors],
    ['interfaces', model.interfaces],
    ['experiences', model.experiences],
    ['screens', model.screens],
    ['domains', model.domains],
    ['capabilities', model.capabilities],
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
  const interfaceIds = new Set(model.interfaces.map(item => item.id))
  const interfacesById = new Map(model.interfaces.map(item => [item.id, item]))
  const experienceIds = new Set(model.experiences.map(experience => experience.id))
  const experiencesById = new Map(model.experiences.map(experience => [experience.id, experience]))
  const domainIds = new Set(model.domains.map(domain => domain.id))
  const capabilityIds = new Set(model.capabilities.map(capability => capability.id))
  const journeyIds = new Set(model.journeys.map(journey => journey.id))
  const scenarioIds = new Set(model.journeys.flatMap(journey => journey.scenarios).map(scenario => scenario.id))
  const kindIds = new Set(model.scenarioKinds.map(kind => kind.id))

  const validateAvailability = (label: string, items: Availability[]): Set<string> => {
    const pairs = new Set<string>()
    const seenInterfaces = new Set<string>()
    for (const item of items) {
      if (!item.interface) errors.push(`${label}: availability needs a non-empty interface`)
      if (seenInterfaces.has(item.interface)) {
        errors.push(`${label}: duplicate availability interface "${item.interface}"`)
      }
      seenInterfaces.add(item.interface)
      if (!interfaceIds.has(item.interface)) {
        errors.push(`${label}: references missing interface "${item.interface}"`)
      }
      if (!item.experiences.length) {
        errors.push(`${label}: availability for interface "${item.interface}" needs at least one experience`)
      }
      const seenExperiences = new Set<string>()
      for (const experienceId of item.experiences) {
        if (seenExperiences.has(experienceId)) {
          errors.push(`${label}: duplicate availability experience "${experienceId}" for interface "${item.interface}"`)
        }
        seenExperiences.add(experienceId)
        const experience = experiencesById.get(experienceId)
        if (!experience) {
          errors.push(`${label}: references missing experience "${experienceId}"`)
        } else if (!experience.interfaces.includes(item.interface)) {
          errors.push(`${label}: experience "${experienceId}" does not declare interface "${item.interface}"`)
        }
        const key = pairKey(item.interface, experienceId)
        if (pairs.has(key)) errors.push(`${label}: duplicate availability pair "${item.interface}/${experienceId}"`)
        pairs.add(key)
      }
    }
    return pairs
  }

  const validateEntryPointInterfaces = (
    label: string,
    points: Array<{ type: string }>,
    allowed: Set<string>
  ) => {
    for (const point of points) {
      if (!allowed.has(point.type)) {
        errors.push(`${label}: entry point references undeclared interface "${point.type}"`)
      }
    }
  }

  for (const actor of model.actors) {
    requireTitle(actor.file, actor.doc.title, actor.doc.lead)
    if (!ACTOR_KINDS.has(actor.kind)) {
      errors.push(`${actor.file}: kind "${actor.kind}" must be person|system`)
    }
    if (!ACTOR_RELATIONSHIPS.has(actor.relationship)) {
      errors.push(`${actor.file}: relationship "${actor.relationship}" must be external|internal`)
    }
  }

  for (const productInterface of model.interfaces) {
    requireTitle(productInterface.file, productInterface.doc.title, productInterface.doc.lead)
    if (!productInterface.actors.length) errors.push(`${productInterface.file}: needs at least one actor`)
    for (const actorId of productInterface.actors) {
      if (!actorIds.has(actorId)) errors.push(`${productInterface.file}: references missing actor "${actorId}"`)
    }
    if (!productInterface.capabilityBoundary) {
      errors.push(`${productInterface.file}: missing "## Capability boundary" section`)
    }
  }

  for (const experience of model.experiences) {
    requireTitle(experience.file, experience.doc.title, experience.doc.lead)
    if (!ACCESS_MODES.has(experience.access)) {
      errors.push(`${experience.file}: access "${experience.access}" must be public|authenticated|restricted`)
    }
    if (!experience.actors.length) errors.push(`${experience.file}: needs at least one actor`)
    if (!experience.interfaces.length) errors.push(`${experience.file}: needs at least one interface`)
    for (const actorId of experience.actors) {
      if (!actorIds.has(actorId)) errors.push(`${experience.file}: references missing actor "${actorId}"`)
    }
    for (const interfaceId of experience.interfaces) {
      const productInterface = interfacesById.get(interfaceId)
      if (!productInterface) {
        errors.push(`${experience.file}: references missing interface "${interfaceId}"`)
        continue
      }
      for (const actorId of experience.actors) {
        if (!productInterface.actors.includes(actorId)) {
          errors.push(`${experience.file}: actor "${actorId}" is not supported by interface "${interfaceId}"`)
        }
      }
    }
    if (!experience.capabilityBoundary) {
      errors.push(`${experience.file}: missing "## Capability boundary" section`)
    }
    validateEntryPointInterfaces(experience.file, experience.entryPoints, new Set(experience.interfaces))
  }

  for (const domain of model.domains) requireTitle(domain.file, domain.doc.title, domain.doc.lead)

  const capabilityPairs = new Map<string, Set<string>>()
  for (const capability of model.capabilities) {
    requireTitle(capability.file, capability.doc.title, capability.doc.lead)
    if (!capability.availability.length) errors.push(`${capability.file}: needs at least one availability pair`)
    if (capability.domain && !domainIds.has(capability.domain)) {
      errors.push(`${capability.file}: references missing domain "${capability.domain}"`)
    }
    capabilityPairs.set(capability.id, validateAvailability(capability.file, capability.availability))
  }

  for (const screen of model.screens) {
    requireTitle(screen.file, screen.doc.title, screen.doc.lead)
    if (!screen.availability.length) errors.push(`${screen.file}: needs at least one availability pair`)
    const pairs = validateAvailability(screen.file, screen.availability)
    if (!screen.capabilities.length) errors.push(`${screen.file}: needs at least one capability`)
    for (const capabilityId of screen.capabilities) {
      if (!capabilityIds.has(capabilityId)) {
        errors.push(`${screen.file}: references missing capability "${capabilityId}"`)
        continue
      }
      const supported = capabilityPairs.get(capabilityId) || new Set<string>()
      for (const pair of pairs) {
        if (!supported.has(pair)) {
          const [interfaceId, experienceId] = pair.split('\0')
          errors.push(`${screen.file}: capability "${capabilityId}" is not available in "${interfaceId}/${experienceId}"`)
        }
      }
    }
    for (const scenarioId of screen.scenarios) {
      if (!scenarioIds.has(scenarioId)) errors.push(`${screen.file}: references missing scenario "${scenarioId}"`)
    }
    validateEntryPointInterfaces(
      screen.file,
      screen.entryPoints,
      new Set(screen.availability.map(item => item.interface))
    )
    if (!screen.information.length) {
      errors.push(`${screen.file}: "## Information presented" needs at least one bullet item`)
    }
    if (!screen.capabilityBoundary) errors.push(`${screen.file}: missing "## Capability boundary" section`)
    if (section(screen.doc, 'Available actions') !== undefined && !screen.actions.length) {
      errors.push(`${screen.file}: "## Available actions" needs at least one bullet item when present`)
    }
    if (section(screen.doc, 'Product states') !== undefined && !screen.states.length) {
      errors.push(`${screen.file}: "## Product states" needs at least one H3 state when present`)
    }
    const stateNames = new Set<string>()
    for (const state of screen.states) {
      const normalized = state.title.toLowerCase()
      if (stateNames.has(normalized)) errors.push(`${screen.file}: duplicate product state "${state.title}"`)
      stateNames.add(normalized)
    }
  }

  const seenScenarioIds = new Map<string, string>()
  for (const journey of model.journeys) {
    requireTitle(journey.file, journey.doc.title, journey.doc.lead)
    if (!journey.actors.length) errors.push(`${journey.file}: needs at least one actor`)
    for (const actorId of journey.actors) {
      if (!actorIds.has(actorId)) errors.push(`${journey.file}: references missing actor "${actorId}"`)
    }
    if (!journey.capabilities.length) errors.push(`${journey.file}: needs at least one capability`)
    if (!journey.availability.length) errors.push(`${journey.file}: needs at least one availability pair`)
    const pairs = validateAvailability(journey.file, journey.availability)
    validateEntryPointInterfaces(
      journey.file,
      journey.entryPoints,
      new Set(journey.availability.map(item => item.interface))
    )
    for (const capabilityId of journey.capabilities) {
      if (!capabilityIds.has(capabilityId)) {
        errors.push(`${journey.file}: references missing capability "${capabilityId}"`)
        continue
      }
      const supported = capabilityPairs.get(capabilityId) || new Set<string>()
      for (const pair of pairs) {
        if (!supported.has(pair)) {
          const [interfaceId, experienceId] = pair.split('\0')
          errors.push(`${journey.file}: capability "${capabilityId}" is not available in "${interfaceId}/${experienceId}"`)
        }
      }
    }
    if (!journey.scenarios.length) errors.push(`${journey.file}: needs at least one scenario`)

    for (const scenario of journey.scenarios) {
      if (!isId(scenario.id)) errors.push(`${scenario.file}: id must be lowercase kebab-case`)
      const previous = seenScenarioIds.get(scenario.id)
      if (previous) errors.push(`${scenario.file}: scenario id "${scenario.id}" already used in ${previous} (ids are global)`)
      seenScenarioIds.set(scenario.id, journey.id)
      if (!scenario.doc.title) errors.push(`${scenario.file}: missing H1 title`)
      if (!scenario.kind || !kindIds.has(scenario.kind)) {
        errors.push(`${scenario.file}: kind "${scenario.kind}" is not defined in taxonomies.yaml`)
      }
      if (!scenario.trigger) errors.push(`${scenario.file}: missing "## Trigger" section`)
      if (!scenario.steps.length) errors.push(`${scenario.file}: "## Steps" needs at least one ordered item`)
      if (!scenario.outcome) errors.push(`${scenario.file}: missing "## Outcome" section`)
      if (scenario.availability.length) {
        const scenarioPairs = validateAvailability(scenario.file, scenario.availability)
        for (const pair of scenarioPairs) {
          if (!pairs.has(pair)) {
            const [interfaceId, experienceId] = pair.split('\0')
            errors.push(`${scenario.file}: availability "${interfaceId}/${experienceId}" is outside journey "${journey.id}"`)
          }
        }
      }
    }
  }

  for (const rule of model.businessRules) {
    requireTitle(rule.file, rule.doc.title, rule.doc.lead)
    if (
      !rule.domains.length
      && !rule.capabilities.length
      && !rule.journeys.length
      && !rule.scenarios.length
      && !rule.availability.length
    ) {
      errors.push(`${rule.file}: must relate to a domain, capability, journey, scenario, or availability pair`)
    }
    for (const domainId of rule.domains) {
      if (!domainIds.has(domainId)) errors.push(`${rule.file}: references missing domain "${domainId}"`)
    }
    for (const capabilityId of rule.capabilities) {
      if (!capabilityIds.has(capabilityId)) errors.push(`${rule.file}: references missing capability "${capabilityId}"`)
    }
    for (const journeyId of rule.journeys) {
      if (!journeyIds.has(journeyId)) errors.push(`${rule.file}: references missing journey "${journeyId}"`)
    }
    for (const scenarioId of rule.scenarios) {
      if (!scenarioIds.has(scenarioId)) errors.push(`${rule.file}: references missing scenario "${scenarioId}"`)
    }
    validateAvailability(rule.file, rule.availability)
  }

  if (model.interfaces.length === 0) errors.push('interfaces/: the model needs at least one interface')
  if (model.experiences.length === 0) errors.push('experiences/: the model needs at least one experience')

  const allEntities = [
    ...model.actors,
    ...model.interfaces,
    ...model.experiences,
    ...model.screens,
    ...model.domains,
    ...model.capabilities,
    ...model.businessRules,
    ...model.journeys,
    ...model.journeys.flatMap(journey => journey.scenarios)
  ]
  const referenceHosts = [{ file: 'product.md', references: model.product.references }, ...allEntities]
  for (const entity of referenceHosts) {
    const targets = new Set<string>()
    for (const reference of entity.references) {
      if (targets.has(reference.target)) {
        errors.push(`${entity.file}: duplicate reference target "${reference.target}"`)
      }
      targets.add(reference.target)
      const path = repositoryReferencePath(reference)
      if (!path || tracked.has(path)) continue
      if (reference.kind === 'code') {
        errors.push(`${entity.file}: code reference path "${path}" is not a tracked file`)
      } else {
        warnings.push(`${entity.file}: reference target "${reference.target}" does not exist in the repository`)
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
      interfaces: model.interfaces.length,
      experiences: model.experiences.length,
      screens: model.screens.length,
      domains: model.domains.length,
      capabilities: model.capabilities.length,
      journeys: model.journeys.length,
      scenarios: scenarios.length,
      businessRules: model.businessRules.length
    }
  }
}

export function runLint(cwd: string, json: boolean): number {
  let modelRoot: string
  let gitRoot: string | undefined
  try {
    ({ modelRoot, gitRoot } = resolveModelRoot(cwd))
  } catch (error) {
    const message = (error as Error).message
    if (json) {
      console.log(JSON.stringify({ ok: false, errors: [message], warnings: [], counts: {} }, null, 2))
    } else {
      console.error(`error: ${message}`)
    }
    return 1
  }
  const model = loadModel(modelRoot)
  const result = lintModel(model, gitRoot ? lsFiles(gitRoot) : [])
  if (json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    for (const error of result.errors) console.error(`error: ${error}`)
    for (const warning of result.warnings) console.warn(`warning: ${warning}`)
    console.log(result.ok
      ? 'Product Model structure is sound.'
      : `Lint failed with ${result.errors.length} error(s).`)
  }
  return result.ok ? 0 : 1
}
