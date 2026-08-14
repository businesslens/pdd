import type { ExactContext, PddModel } from '../core/model.js'
import { repositoryReferencePath } from '../core/frontmatter.js'
import { lsFiles } from '../core/git.js'
import { counterpartKey, interfaceOf, isId, isQualifiedId } from '../core/ids.js'
import { containsStructuralHeading, section, type MarkdownDoc } from '../core/markdown.js'
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
const JOURNEY_RESULTS = new Set(['achieved', 'not-achieved'])

/** A scope id is already its own key and its own label. */
function availabilityLabel(scope: string): string {
  return scope
}

function intersects(left: Set<string>, right: Set<string>): boolean {
  for (const value of left) if (right.has(value)) return true
  return false
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

  const validateSections = (
    label: string,
    doc: MarkdownDoc,
    recognized: string[],
    forbidden: string[] = []
  ) => {
    const recognizedSet = new Set(recognized.map(heading => heading.toLowerCase()))
    const forbiddenSet = new Set(forbidden.map(heading => heading.toLowerCase()))
    const seen = new Set<string>()
    if (containsStructuralHeading(doc.lead)) {
      errors.push(`${label}: lead paragraph must not contain an H1 or H2 heading`)
    }
    for (const item of doc.sections) {
      const normalized = item.heading.toLowerCase()
      if (recognizedSet.has(normalized)) {
        if (seen.has(normalized)) errors.push(`${label}: duplicate "## ${item.heading}" section`)
        seen.add(normalized)
      }
      if (forbiddenSet.has(normalized)) {
        errors.push(`${label}: "## ${item.heading}" is not allowed on this entity type`)
      }
      if (containsStructuralHeading(item.body)) {
        errors.push(`${label}: "## ${item.heading}" content must not contain an H1 or H2 heading`)
      }
    }
  }

  const validateListSection = (
    label: string,
    doc: MarkdownDoc,
    heading: string,
    kind: 'ordered' | 'bullet'
  ) => {
    const body = section(doc, heading)
    if (body === undefined) return
    const pattern = kind === 'ordered' ? /^\s*\d+[.)]\s+\S.*$/ : /^\s*[-*]\s+\S.*$/
    if (body.split('\n').some(line => line.trim() && !pattern.test(line))) {
      errors.push(`${label}: "## ${heading}" must contain only single-line ${kind}-list items`)
    }
  }

  if (model.product.id && !isId(model.product.id)) errors.push('product.md: id must be lowercase kebab-case')
  if (model.product.id.length > 64) errors.push('product.md: id must be at most 64 characters')
  if (!model.product.id) errors.push('product.md: missing id')
  requireTitle('product.md', model.product.doc.title, model.product.doc.lead)
  validateSections('product.md', model.product.doc, ['Intent'])
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
    ['capabilityScenarios', model.capabilityScenarios],
    ['businessRules', model.businessRules],
    ['journeys', model.journeys],
    ['journeyScenarios', model.journeyScenarios],
    ['scenarioKinds', model.scenarioKinds]
  ]
  // Surface-tree ids carry the path that distinguishes repeated names across
  // Interfaces; behavior-tree ids stay bare and globally unique.
  const QUALIFIED_COLLECTIONS = new Set(['interfaces', 'experiences', 'screens'])
  for (const [name, items] of collections) {
    const valid = QUALIFIED_COLLECTIONS.has(name) ? isQualifiedId : isId
    for (const item of items) {
      if (!valid(item.id)) errors.push(`${name}: id "${item.id}" must be lowercase kebab-case`)
    }
  }

  const actorIds = new Set(model.actors.map(actor => actor.id))
  const interfaceIds = new Set(model.interfaces.map(item => item.id))
  const interfacesById = new Map(model.interfaces.map(item => [item.id, item]))
  const experiencesById = new Map(model.experiences.map(experience => [experience.id, experience]))
  const experienceScopedInterfaces = new Set(model.experiences.map(experience => experience.interface))
  /* Every scope a Capability, Screen or context may name: an undivided Interface, or an Experience. */
  const scopeIds = new Set<string>([
    ...model.interfaces.filter(item => !experienceScopedInterfaces.has(item.id)).map(item => item.id),
    ...model.experiences.map(experience => experience.id)
  ])
  const domainIds = new Set(model.domains.map(domain => domain.id))
  const capabilityIds = new Set(model.capabilities.map(capability => capability.id))
  const journeyIds = new Set(model.journeys.map(journey => journey.id))
  const capabilityScenarioIds = new Set(model.capabilityScenarios.map(scenario => scenario.id))
  const journeyScenarioIds = new Set(model.journeyScenarios.map(scenario => scenario.id))
  const kindIds = new Set(model.scenarioKinds.map(kind => kind.id))

  /*
    A scope either resolves in the tree or it does not. That single check
    replaces the nested availability record, the "needs an experience because
    the interface uses Experience contexts" rule, its mirror image, and the
    prohibition on mixing the two — all four were consequences of an Experience
    being able to span Interfaces.
  */
  const resolveScope = (label: string, scope: string, what: string): boolean => {
    if (!scope) {
      errors.push(`${label}: ${what} needs a non-empty scope id`)
      return false
    }
    if (!isQualifiedId(scope)) {
      errors.push(`${label}: ${what} scope "${scope}" is not a valid scope id`)
      return false
    }
    if (scopeIds.has(scope)) return true
    const owner = interfaceOf(scope)
    if (!interfaceIds.has(owner)) {
      errors.push(`${label}: ${what} references missing interface "${owner}"`)
    } else if (scope === owner) {
      errors.push(`${label}: interface "${owner}" is divided into Experiences, so name one of them`)
    } else {
      errors.push(`${label}: ${what} references missing experience "${scope}"`)
    }
    return false
  }

  const validateAvailability = (label: string, items: string[]): Set<string> => {
    const scopes = new Set<string>()
    for (const scope of items) {
      if (scopes.has(scope)) errors.push(`${label}: duplicate availability scope "${scope}"`)
      if (resolveScope(label, scope, 'availability')) scopes.add(scope)
    }
    return scopes
  }

  const validateExactContext = (label: string, context: ExactContext): string => {
    resolveScope(label, context, 'context')
    return context
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
    validateSections(actor.file, actor.doc, ['Intent'])
    if (!ACTOR_KINDS.has(actor.kind)) {
      errors.push(`${actor.file}: kind "${actor.kind}" must be person|system`)
    }
    if (!ACTOR_RELATIONSHIPS.has(actor.relationship)) {
      errors.push(`${actor.file}: relationship "${actor.relationship}" must be external|internal`)
    }
  }

  for (const productInterface of model.interfaces) {
    requireTitle(productInterface.file, productInterface.doc.title, productInterface.doc.lead)
    validateSections(productInterface.file, productInterface.doc, ['Intent', 'Capability boundary'])
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
    validateSections(experience.file, experience.doc, ['Intent', 'Capability boundary'])
    if (!ACCESS_MODES.has(experience.access)) {
      errors.push(`${experience.file}: access "${experience.access}" must be public|authenticated|restricted`)
    }
    if (!experience.actors.length) errors.push(`${experience.file}: needs at least one actor`)
    for (const actorId of experience.actors) {
      if (!actorIds.has(actorId)) errors.push(`${experience.file}: references missing actor "${actorId}"`)
    }
    const owner = interfacesById.get(experience.interface)
    if (owner) {
      for (const actorId of experience.actors) {
        if (!owner.actors.includes(actorId)) {
          errors.push(`${experience.file}: actor "${actorId}" is not supported by interface "${experience.interface}"`)
        }
      }
    }
    if (!experience.capabilityBoundary) {
      errors.push(`${experience.file}: missing "## Capability boundary" section`)
    }
    validateEntryPointInterfaces(experience.file, experience.entryPoints, new Set([experience.interface]))
  }

  for (const productInterface of model.interfaces) {
    if (!experienceScopedInterfaces.has(productInterface.id)) continue
    const coveredActors = new Set(
      model.experiences
        .filter(experience => experience.interface === productInterface.id)
        .flatMap(experience => experience.actors)
    )
    for (const actorId of productInterface.actors) {
      if (!coveredActors.has(actorId)) {
        errors.push(`${productInterface.file}: actor "${actorId}" is not covered by any Experience declaring this interface`)
      }
    }
  }

  for (const domain of model.domains) {
    requireTitle(domain.file, domain.doc.title, domain.doc.lead)
    validateSections(domain.file, domain.doc, ['Intent'])
  }

  const capabilityPairs = new Map<string, Set<string>>()
  for (const capability of model.capabilities) {
    requireTitle(capability.file, capability.doc.title, capability.doc.lead)
    validateSections(capability.file, capability.doc, ['Intent'])
    if (!capability.availability.length) errors.push(`${capability.file}: needs at least one availability scope`)
    if (capability.domain && !domainIds.has(capability.domain)) {
      errors.push(`${capability.file}: references missing domain "${capability.domain}"`)
    }
    capabilityPairs.set(capability.id, validateAvailability(capability.file, capability.availability))
  }

  /*
    Who a scope permits. An Experience is authoritative for its own audience;
    an undivided Interface is authoritative for its.
  */
  const supportedActorsForPair = (scope: string): Set<string> | undefined => {
    const experience = experiencesById.get(scope)
    if (experience) return new Set(experience.actors)
    const productInterface = interfacesById.get(scope)
    return productInterface ? new Set(productInterface.actors) : undefined
  }

  const validateScenarioActors = (label: string, actors: string[], pairs: Set<string>) => {
    if (!actors.length) errors.push(`${label}: needs at least one actor`)
    for (const actorId of actors) {
      if (!actorIds.has(actorId)) errors.push(`${label}: references missing actor "${actorId}"`)
    }
    const supportedSomewhere = new Set<string>()
    for (const pair of pairs) {
      const supported = supportedActorsForPair(pair)
      if (!supported) continue
      const participating = actors.filter(actorId => supported.has(actorId))
      if (!participating.length) {
        errors.push(`${label}: context "${availabilityLabel(pair)}" permits none of the Scenario Actors`)
      }
      for (const actorId of participating) supportedSomewhere.add(actorId)
    }
    for (const actorId of actors) {
      if (actorIds.has(actorId) && !supportedSomewhere.has(actorId)) {
        errors.push(`${label}: actor "${actorId}" is not supported by any selected context`)
      }
    }
  }

  const validateScenarioSections = (scenario: {
    file: string
    doc: { title: string, lead: string, sections: Array<{ heading: string, body: string }> }
    kind: string
    trigger: string
    steps: string[]
    outcome: string
    edgeCases: string[]
  }) => {
    if (!scenario.doc.title) errors.push(`${scenario.file}: missing H1 title`)
    if (scenario.doc.lead) {
      errors.push(`${scenario.file}: carries no lead paragraph; move that content into "## Trigger" or another explicit section`)
    }
    validateSections(
      scenario.file,
      scenario.doc,
      ['Intent', 'Trigger', 'Steps', 'Decision points', 'Outcome', 'Edge cases'],
      ['Goal', 'Success criterion']
    )
    validateListSection(scenario.file, scenario.doc, 'Steps', 'ordered')
    validateListSection(scenario.file, scenario.doc, 'Edge cases', 'bullet')
    if (!scenario.kind || !kindIds.has(scenario.kind)) {
      errors.push(`${scenario.file}: kind "${scenario.kind}" is not defined in taxonomies.yaml`)
    }
    if (!scenario.trigger) errors.push(`${scenario.file}: missing "## Trigger" section`)
    if (!scenario.steps.length) errors.push(`${scenario.file}: "## Steps" needs at least one ordered item`)
    if (!scenario.outcome) errors.push(`${scenario.file}: missing "## Outcome" section`)
    if (section(scenario.doc, 'Edge cases') !== undefined && !scenario.edgeCases.length) {
      errors.push(`${scenario.file}: "## Edge cases" needs at least one bullet item when present`)
    }
  }

  const seenScenarioIds = new Map<string, string>()
  for (const scenario of [...model.capabilityScenarios, ...model.journeyScenarios]) {
    const previous = seenScenarioIds.get(scenario.id)
    if (previous) {
      errors.push(`${scenario.file}: scenario id "${scenario.id}" already used in ${previous} (ids are global)`)
    }
    seenScenarioIds.set(scenario.id, scenario.file)
  }

  const capabilityScenariosById = new Map(model.capabilityScenarios.map(scenario => [scenario.id, scenario]))
  const capabilityScenarioPairs = new Map<string, Set<string>>()
  const coveredCapabilityPairs = new Map<string, Set<string>>()
  for (const scenario of model.capabilityScenarios) {
    validateScenarioSections(scenario)
    if (!scenario.capability) {
      errors.push(`${scenario.file}: needs one capability`)
    } else if (!capabilityIds.has(scenario.capability)) {
      errors.push(`${scenario.file}: references missing capability "${scenario.capability}"`)
    }
    if (!scenario.availability.length) errors.push(`${scenario.file}: needs at least one availability scope`)
    const pairs = validateAvailability(scenario.file, scenario.availability)
    capabilityScenarioPairs.set(scenario.id, pairs)
    const coveredPairs = coveredCapabilityPairs.get(scenario.capability) || new Set<string>()
    for (const pair of pairs) coveredPairs.add(pair)
    coveredCapabilityPairs.set(scenario.capability, coveredPairs)
    const supported = capabilityPairs.get(scenario.capability) || new Set<string>()
    for (const pair of pairs) {
      if (!supported.has(pair)) {
        errors.push(`${scenario.file}: availability "${availabilityLabel(pair)}" is outside capability "${scenario.capability}"`)
      }
    }
    validateScenarioActors(scenario.file, scenario.actors, pairs)
  }
  for (const capability of model.capabilities) {
    const covered = coveredCapabilityPairs.get(capability.id) || new Set<string>()
    const required = capabilityPairs.get(capability.id) || new Set<string>()
    for (const pair of required) {
      if (covered.has(pair)) continue
      const finding = `${capability.file}: availability "${availabilityLabel(pair)}" needs Capability Scenario coverage`
      if (model.coverage.status === 'complete') errors.push(finding)
      else warnings.push(finding)
    }
  }

  const journeysById = new Map(model.journeys.map(journey => [journey.id, journey]))
  for (const journey of model.journeys) {
    if (!journey.doc.title) errors.push(`${journey.file}: missing H1 title`)
    if (journey.doc.lead) {
      errors.push(`${journey.file}: carries no lead paragraph; move that content into "## Goal"`)
    }
    validateSections(
      journey.file,
      journey.doc,
      ['Intent', 'Goal', 'Success criterion'],
      ['Trigger', 'Steps', 'Decision points', 'Outcome', 'Edge cases']
    )
    if (!journey.actors.length) errors.push(`${journey.file}: needs at least one actor`)
    for (const actorId of journey.actors) {
      if (!actorIds.has(actorId)) errors.push(`${journey.file}: references missing actor "${actorId}"`)
    }
    if (!journey.goal) errors.push(`${journey.file}: missing "## Goal" section`)
    if (!journey.successCriterion) errors.push(`${journey.file}: missing "## Success criterion" section`)
    if (!model.journeyScenarios.some(scenario => scenario.journey === journey.id && scenario.result === 'achieved')) {
      errors.push(`${journey.file}: needs at least one achieved Journey Scenario`)
    }
  }

  const journeyScenariosById = new Map(model.journeyScenarios.map(scenario => [scenario.id, scenario]))
  const journeyScenarioFlow = new Map<string, Array<{ capability: string, pairs: Set<string> }>>()
  for (const scenario of model.journeyScenarios) {
    validateScenarioSections(scenario)
    const journey = journeysById.get(scenario.journey)
    if (!journey) errors.push(`${scenario.file}: references missing journey "${scenario.journey}"`)
    if (!JOURNEY_RESULTS.has(scenario.result)) {
      errors.push(`${scenario.file}: result "${scenario.result}" must be achieved|not-achieved`)
    }
    if (journey && !scenario.actors.some(actorId => journey.actors.includes(actorId))) {
      errors.push(`${scenario.file}: actors must include at least one actor from journey "${scenario.journey}"`)
    }
    if (!scenario.flow.length) errors.push(`${scenario.file}: needs at least one flow item`)
    if (!scenario.routes.length) errors.push(`${scenario.file}: needs at least one route`)
    const stagesById = new Map<string, typeof scenario.flow[number]>()
    const flowEntries: Array<{ capability: string, pairs: Set<string> }> = scenario.flow.map(item => ({
      capability: item.capability,
      pairs: new Set<string>()
    }))
    const allPairs = new Set<string>()
    for (const [index, item] of scenario.flow.entries()) {
      const label = `${scenario.file}: flow item ${index + 1}`
      if (!item.id) errors.push(`${label}: needs a non-empty id`)
      else if (!isId(item.id)) errors.push(`${label}: id "${item.id}" must be lowercase kebab-case`)
      if (stagesById.has(item.id)) errors.push(`${label}: duplicate flow id "${item.id}"`)
      stagesById.set(item.id, item)
      if (!item.capability) {
        errors.push(`${label}: needs one capability`)
      } else if (!capabilityIds.has(item.capability)) {
        errors.push(`${label}: references missing capability "${item.capability}"`)
      }
      if (!item.operation.trim()) errors.push(`${label}: needs a non-empty operation`)
      if (/\r|\n/.test(item.operation)) errors.push(`${label}: operation must be a single line`)
    }
    const routeIds = new Set<string>()
    for (const [routeIndex, route] of scenario.routes.entries()) {
      const routeLabel = `${scenario.file}: route ${routeIndex + 1}`
      if (!route.id) errors.push(`${routeLabel}: needs a non-empty id`)
      else if (!isId(route.id)) errors.push(`${routeLabel}: id "${route.id}" must be lowercase kebab-case`)
      if (routeIds.has(route.id)) errors.push(`${routeLabel}: duplicate route id "${route.id}"`)
      routeIds.add(route.id)
      const seenStages = new Set<string>()
      const routePairsByStage = new Map<string, string>()
      for (const [contextIndex, context] of route.contexts.entries()) {
        const contextLabel = `${routeLabel}: context ${contextIndex + 1}`
        if (!context.stage) errors.push(`${contextLabel}: needs a non-empty stage`)
        if (seenStages.has(context.stage)) errors.push(`${contextLabel}: duplicate stage "${context.stage}"`)
        seenStages.add(context.stage)
        const stage = stagesById.get(context.stage)
        if (!stage) errors.push(`${contextLabel}: references missing flow stage "${context.stage}"`)
        const pair = validateExactContext(contextLabel, context.context)
        routePairsByStage.set(context.stage, pair)
        allPairs.add(pair)
        if (stage) {
          const supported = capabilityPairs.get(stage.capability) || new Set<string>()
          if (!supported.has(pair)) {
            errors.push(`${contextLabel}: context "${availabilityLabel(pair)}" is outside capability "${stage.capability}"`)
          }
          const flowIndex = scenario.flow.findIndex(item => item.id === context.stage)
          if (flowIndex >= 0) flowEntries[flowIndex]!.pairs.add(pair)
        }
      }
      for (const stage of scenario.flow) {
        if (!seenStages.has(stage.id)) errors.push(`${routeLabel}: missing context for flow stage "${stage.id}"`)
      }
      const firstStage = scenario.flow[0]
      const firstPair = firstStage ? routePairsByStage.get(firstStage.id) : undefined
      if (journey && firstPair) {
        const supported = supportedActorsForPair(firstPair) || new Set<string>()
        const canStart = scenario.actors.some(actorId => journey.actors.includes(actorId) && supported.has(actorId))
        if (!canStart) {
          errors.push(`${routeLabel}: first context "${availabilityLabel(firstPair)}" permits no Journey Actor participating in the Scenario`)
        }
      }
    }
    journeyScenarioFlow.set(scenario.id, flowEntries)
    validateScenarioActors(scenario.file, scenario.actors, allPairs)
    if (scenario.result === 'achieved' && new Set(scenario.flow.map(item => item.capability)).size < 2) {
      errors.push(`${scenario.file}: an achieved Journey Scenario needs at least two distinct Capabilities`)
    }
  }

  for (const journey of model.journeys) {
    const achievedActorIds = new Set(
      model.journeyScenarios
        .filter(scenario => scenario.journey === journey.id && scenario.result === 'achieved')
        .flatMap(scenario => scenario.actors)
    )
    for (const actorId of journey.actors) {
      if (!achievedActorIds.has(actorId)) {
        errors.push(`${journey.file}: actor "${actorId}" needs an achieved Journey Scenario`)
      }
    }
  }

  for (const screen of model.screens) {
    requireTitle(screen.file, screen.doc.title, screen.doc.lead)
    validateSections(
      screen.file,
      screen.doc,
      ['Intent', 'Information presented', 'Available actions', 'Product states', 'Capability boundary']
    )
    validateListSection(screen.file, screen.doc, 'Information presented', 'bullet')
    validateListSection(screen.file, screen.doc, 'Available actions', 'bullet')
    if (!screen.availability.length) errors.push(`${screen.file}: needs at least one availability scope`)
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
          errors.push(`${screen.file}: capability "${capabilityId}" is not available in "${availabilityLabel(pair)}"`)
        }
      }
    }
    for (const scenarioId of screen.capabilityScenarios) {
      const scenario = capabilityScenariosById.get(scenarioId)
      if (!scenario) {
        errors.push(`${screen.file}: references missing Capability Scenario "${scenarioId}"`)
      } else {
        if (!screen.capabilities.includes(scenario.capability)) {
          errors.push(`${screen.file}: Capability Scenario "${scenarioId}" uses capability "${scenario.capability}" outside the Screen capability list`)
        }
        if (!intersects(pairs, capabilityScenarioPairs.get(scenarioId) || new Set<string>())) {
          errors.push(`${screen.file}: Capability Scenario "${scenarioId}" shares no exact context with the Screen`)
        }
      }
    }
    for (const scenarioId of screen.journeyScenarios) {
      if (!journeyScenariosById.has(scenarioId)) {
        errors.push(`${screen.file}: references missing Journey Scenario "${scenarioId}"`)
        continue
      }
      const participates = (journeyScenarioFlow.get(scenarioId) || []).some(item =>
        screen.capabilities.includes(item.capability) && intersects(pairs, item.pairs)
      )
      if (!participates) {
        errors.push(`${screen.file}: Journey Scenario "${scenarioId}" has no flow item matching a Screen capability and exact context`)
      }
    }
    validateEntryPointInterfaces(
      screen.file,
      screen.entryPoints,
      new Set(screen.availability.map(scope => interfaceOf(scope)))
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
    // A capture that names a state it does not depict is worse than one that
    // names nothing, so the state has to resolve to an authored H3.
    for (const reference of screen.references) {
      if (reference.state === undefined) continue
      if (!stateNames.has(reference.state.toLowerCase())) {
        errors.push(`${screen.file}: reference state "${reference.state}" is not a product state of this Screen`)
      }
    }
  }

  for (const rule of model.businessRules) {
    requireTitle(rule.file, rule.doc.title, rule.doc.lead)
    validateSections(rule.file, rule.doc, ['Intent', 'Rationale'])
    if (!rule.appliesTo.length) errors.push(`${rule.file}: needs at least one appliesTo target`)
    const seenTargets = new Set<string>()
    const capabilityTargets = new Set<string>()
    const journeyTargets = new Set<string>()
    const capabilityScenarioTargets: string[] = []
    const journeyScenarioTargets: string[] = []
    for (const [index, target] of rule.appliesTo.entries()) {
      const label = `${rule.file}: appliesTo item ${index + 1}`
      if (target.type === 'context') {
        const pair = validateExactContext(label, target.context)
        const key = `context\0${pair}`
        if (seenTargets.has(key)) errors.push(`${label}: duplicate context target "${availabilityLabel(pair)}"`)
        seenTargets.add(key)
        continue
      }
      if (!['capability', 'capability-scenario', 'journey', 'journey-scenario'].includes(target.type)) {
        errors.push(`${label}: type "${target.type}" must be capability|capability-scenario|journey|journey-scenario|context`)
        continue
      }
      if (!target.id) errors.push(`${label}: needs a non-empty id`)
      const key = `${target.type}\0${target.id}`
      if (seenTargets.has(key)) errors.push(`${label}: duplicate target "${target.type}:${target.id}"`)
      seenTargets.add(key)
      let supported = new Set<string>()
      if (target.type === 'capability') {
        if (!capabilityIds.has(target.id)) errors.push(`${label}: references missing capability "${target.id}"`)
        capabilityTargets.add(target.id)
        supported = capabilityPairs.get(target.id) || supported
      } else if (target.type === 'capability-scenario') {
        if (!capabilityScenarioIds.has(target.id)) errors.push(`${label}: references missing Capability Scenario "${target.id}"`)
        capabilityScenarioTargets.push(target.id)
        supported = capabilityScenarioPairs.get(target.id) || supported
      } else if (target.type === 'journey') {
        if (!journeyIds.has(target.id)) errors.push(`${label}: references missing journey "${target.id}"`)
        journeyTargets.add(target.id)
        for (const scenario of model.journeyScenarios.filter(item => item.journey === target.id && item.result === 'achieved')) {
          for (const entry of journeyScenarioFlow.get(scenario.id) || []) {
            for (const pair of entry.pairs) supported.add(pair)
          }
        }
      } else {
        if (!journeyScenarioIds.has(target.id)) errors.push(`${label}: references missing Journey Scenario "${target.id}"`)
        journeyScenarioTargets.push(target.id)
        for (const entry of journeyScenarioFlow.get(target.id) || []) {
          for (const pair of entry.pairs) supported.add(pair)
        }
      }
      const seenContexts = new Set<string>()
      for (const [contextIndex, context] of target.contexts.entries()) {
        const contextLabel = `${label}: context ${contextIndex + 1}`
        const pair = validateExactContext(contextLabel, context)
        if (seenContexts.has(pair)) errors.push(`${contextLabel}: duplicate context "${availabilityLabel(pair)}"`)
        seenContexts.add(pair)
        if (!supported.has(pair)) {
          errors.push(`${contextLabel}: context "${availabilityLabel(pair)}" is outside target "${target.type}:${target.id}"`)
        }
      }
    }
    for (const scenarioId of capabilityScenarioTargets) {
      const capabilityId = capabilityScenariosById.get(scenarioId)?.capability
      if (capabilityId && capabilityTargets.has(capabilityId)) {
        errors.push(`${rule.file}: target "capability-scenario:${scenarioId}" is redundant with capability target "${capabilityId}"`)
      }
    }
    for (const scenarioId of journeyScenarioTargets) {
      const journeyId = journeyScenariosById.get(scenarioId)?.journey
      if (journeyId && journeyTargets.has(journeyId)) {
        errors.push(`${rule.file}: target "journey-scenario:${scenarioId}" is redundant with journey target "${journeyId}"`)
      }
    }
  }

  if (model.interfaces.length === 0) errors.push('interfaces/: the model needs at least one interface')
  if (model.coverage.status === 'complete' && model.capabilities.length === 0) {
    errors.push('capabilities/: a complete model needs at least one capability')
  }

  const allEntities = [
    ...model.actors,
    ...model.interfaces,
    ...model.experiences,
    ...model.screens,
    ...model.domains,
    ...model.capabilities,
    ...model.capabilityScenarios,
    ...model.businessRules,
    ...model.journeys,
    ...model.journeyScenarios
  ]
  /*
    Asset metadata is additive: it titles and scopes files that are already
    there, and never sets their class. Class is the path — anything under
    `implementation/` describes this realization — which is the only rule a
    foreign tool writing a capture on CI can actually satisfy.
  */
  for (const entity of allEntities) {
    const present = new Set(entity.assets)
    const stateNames = new Set(
      model.screens.find(screen => screen.file === entity.file)?.states.map(state => state.title.toLowerCase()) ?? []
    )
    const isScreen = model.screens.some(screen => screen.file === entity.file)
    for (const asset of entity.assetMeta) {
      if (!present.has(asset.file)) {
        errors.push(`${entity.file}: asset "${asset.file}" is not a file in this entity's expanded folder`)
      }
      if (asset.state === undefined) continue
      if (!isScreen) {
        errors.push(`${entity.file}: asset "state" is only valid on a Screen`)
      } else if (!stateNames.has(asset.state.toLowerCase())) {
        errors.push(`${entity.file}: asset state "${asset.state}" is not a product state of this Screen`)
      }
    }
  }

  const referenceHosts = [{ file: 'product.md', references: model.product.references }, ...allEntities]
  const screenFiles = new Set(model.screens.map(screen => screen.file))
  for (const entity of referenceHosts) {
    const targets = new Set<string>()
    for (const reference of entity.references) {
      if (targets.has(reference.target)) {
        errors.push(`${entity.file}: duplicate reference target "${reference.target}"`)
      }
      targets.add(reference.target)
      // Product states are a Screen concept; nowhere else has an H3 set for a
      // state to resolve against, so the key would mean nothing there.
      if (reference.state !== undefined && !screenFiles.has(entity.file)) {
        errors.push(`${entity.file}: reference "state" is only valid on a Screen`)
      }
      const path = repositoryReferencePath(reference)
      if (!path || tracked.has(path)) continue
      if (reference.kind === 'code') {
        errors.push(`${entity.file}: code reference path "${path}" is not a tracked file`)
      } else {
        warnings.push(`${entity.file}: reference target "${reference.target}" does not exist in the repository`)
      }
    }
  }

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
      capabilityScenarios: model.capabilityScenarios.length,
      journeys: model.journeys.length,
      journeyScenarios: model.journeyScenarios.length,
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
