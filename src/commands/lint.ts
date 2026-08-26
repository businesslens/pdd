import type { Context } from '../core/frontmatter.js'
import { repositoryReferencePath } from '../core/frontmatter.js'
import type { PddModel } from '../core/model.js'
import { lsFiles } from '../core/git.js'
import { containsPlace, counterpartKey, interfaceOf, isId, isQualifiedId } from '../core/ids.js'
import { INTERFACE_TYPES } from '../core/interface-types.js'
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
const INTERFACE_TYPE_SET = new Set<string>(INTERFACE_TYPES)

function sameSet(left: Set<string>, right: Set<string>): boolean {
  return left.size === right.size && [...left].every(value => right.has(value))
}

/** Pure structural rule engine over a loaded model; trackedFiles injected for testability. */
export function lintModel(model: PddModel, trackedFiles: string[]): LintResult {
  const errors = [...model.issues]
  const warnings: string[] = [...model.notices]
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
        errors.push(`${label}: "## ${item.heading}" is not allowed on this element type`)
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
  // Interface, Experience, and Screen ids carry the path that distinguishes
  // repeated names across Interfaces; behavior ids stay bare and globally unique.
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
  /* Capability availability names a boundary: an undivided Interface or an Experience. */
  const availabilityPlaceIds = new Set<string>([
    ...model.interfaces.filter(item => !experienceScopedInterfaces.has(item.id)).map(item => item.id),
    ...model.experiences.map(experience => experience.id)
  ])
  const placeIds = new Set<string>([
    ...model.interfaces.map(item => item.id),
    ...model.experiences.map(item => item.id),
    ...model.screens.map(item => item.id)
  ])
  const domainIds = new Set(model.domains.map(domain => domain.id))
  const capabilityIds = new Set(model.capabilities.map(capability => capability.id))
  const journeyIds = new Set(model.journeys.map(journey => journey.id))
  const capabilityScenarioIds = new Set(model.capabilityScenarios.map(scenario => scenario.id))
  const journeyScenarioIds = new Set(model.journeyScenarios.map(scenario => scenario.id))
  const kindIds = new Set(model.scenarioKinds.map(kind => kind.id))

  const validateContextPlace = (label: string, context: Context): string => {
    const place = context.place
    if (!place) {
      errors.push(`${label}: Context needs a non-empty place id`)
      return place
    }
    if (!isQualifiedId(place)) {
      errors.push(`${label}: Context place "${place}" is not a valid Interface, Experience, or Screen id`)
      return place
    }
    if (!placeIds.has(place)) {
      errors.push(`${label}: Context references missing place "${place}"`)
    }
    return place
  }

  const resolveAvailabilityPlace = (label: string, place: string): boolean => {
    if (!place) {
      errors.push(`${label}: availability Context needs a non-empty place id`)
      return false
    }
    if (!isQualifiedId(place)) {
      errors.push(`${label}: availability Context place "${place}" is not a valid Interface, Experience, or Screen id`)
      return false
    }
    if (availabilityPlaceIds.has(place)) return true
    if (model.screens.some(screen => screen.id === place)) {
      errors.push(`${label}: availability Context place "${place}" must name its containing Interface or Experience, not a Screen`)
      return false
    }
    const owner = interfaceOf(place)
    if (!interfaceIds.has(owner)) {
      errors.push(`${label}: availability Context references missing interface "${owner}"`)
    } else if (place === owner) {
      errors.push(`${label}: interface "${owner}" is divided into Experiences, so name one of them`)
    } else {
      errors.push(`${label}: availability Context references missing experience "${place}"`)
    }
    return false
  }

  const validateAvailability = (label: string, contexts: Context[]): Set<string> => {
    const places = new Set<string>()
    for (const context of contexts) {
      const place = context.place
      if (places.has(place)) errors.push(`${label}: duplicate availability Context place "${place}"`)
      if (resolveAvailabilityPlace(label, place)) places.add(place)
    }
    return places
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
    if (!INTERFACE_TYPE_SET.has(productInterface.type)) {
      errors.push(`${productInterface.file}: type "${productInterface.type}" must be ${INTERFACE_TYPES.join('|')}`)
    }
    if (!productInterface.actors.length) errors.push(`${productInterface.file}: needs at least one actor`)
    for (const actorId of productInterface.actors) {
      if (!actorIds.has(actorId)) errors.push(`${productInterface.file}: references missing actor "${actorId}"`)
    }
    if (!productInterface.capabilityBoundary) {
      errors.push(`${productInterface.file}: missing "## Capability boundary" section`)
    }
    /*
     * F11 — one entry-point key vocabulary per element. On an Interface the key
     * is that Interface's own `type`; on an Experience or Screen it is the
     * containing Interface's id. Previously the Interface case was unchecked,
     * so two authors used three different vocabularies and both linted clean.
     */
    for (const entryPoint of productInterface.entryPoints) {
      if (entryPoint.type !== productInterface.type) {
        errors.push(
          `${productInterface.file}: entry point key "${entryPoint.type}" must be this Interface's type "${productInterface.type}"`
        )
      }
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

  const capabilitiesPerDomain = new Map<string, number>()
  for (const capability of model.capabilities) {
    if (!capability.domain) continue
    capabilitiesPerDomain.set(capability.domain, (capabilitiesPerDomain.get(capability.domain) || 0) + 1)
  }
  for (const domain of model.domains) {
    requireTitle(domain.file, domain.doc.title, domain.doc.lead)
    validateSections(domain.file, domain.doc, ['Intent', 'Boundary'])
    // A Boundary that only asserts inclusion is a label, not a region. Stating
    // what a Domain does *not* own is what makes it checkable.
    if (!domain.boundary.trim()) {
      errors.push(`${domain.file}: a Domain needs a "## Boundary" section`)
    } else if (!/\b(does not|doesn't|not own|never|excludes?|rather than|outside)\b/i.test(domain.boundary)) {
      errors.push(
        `${domain.file}: "## Boundary" must state what the Domain does not own, not only what it covers`
      )
    }
    const held = capabilitiesPerDomain.get(domain.id) || 0
    if (held < 2) {
      warnings.push(
        `${domain.file}: names ${held} Capabilit${held === 1 ? 'y' : 'ies'}; a Domain holding fewer than two is a folder, not a region`
      )
    }
  }

  /*
   * F2 — whether an Interface is divided into Experiences is DERIVED, never
   * judged. An Interface must hold Experiences when it serves more than one
   * `access` value, or two or more Actor sets whose Capability coverage is
   * disjoint; it must not when neither holds. Every input is already authored,
   * so the linter decides the question and an author never applies a prose test
   * to it. Without this, one product had two lint-clean encodings whose ids
   * shared nothing.
   */
  const experiencesByInterface = new Map<string, typeof model.experiences>()
  for (const experience of model.experiences) {
    const list = experiencesByInterface.get(experience.interface) || []
    list.push(experience)
    experiencesByInterface.set(experience.interface, list)
  }
  for (const productInterface of model.interfaces) {
    const owned = experiencesByInterface.get(productInterface.id) || []

    // Actor sets that reach this Interface, grouped by the Capabilities available there.
    const actorSets: Array<Set<string>> = []
    for (const capability of model.capabilities) {
      const here = capability.availability.some(
        context => context.place === productInterface.id || context.place.startsWith(`${productInterface.id}::`)
      )
      if (!here) continue
      const reached = new Set(
        productInterface.actors.filter(actorId =>
          model.capabilityScenarios.some(
            scenario =>
              scenario.capability === capability.id &&
              // A Scenario's Actor set is derived from its Steps, never authored.
              scenario.steps.some(step => step.kind === 'actor' && step.actor === actorId)
          )
        )
      )
      if (reached.size) actorSets.push(reached)
    }
    const disjointAudiences = actorSets.some(left =>
      actorSets.some(right => left !== right && ![...left].some(actorId => right.has(actorId)))
    )
    const accessModes = new Set(owned.map(experience => experience.access).filter(Boolean))
    const mustDivide = accessModes.size > 1 || disjointAudiences

    /*
     * Counterpart symmetry is an exception, and a principled one. When the same
     * Experience name exists under another Interface, the two are counterparts by
     * construction — the same context on two platforms. Forcing one to flatten
     * because it happens to carry a single Experience would destroy that
     * relationship and make two views of one context look unrelated.
     */
    const hasCounterpart = owned.some(experience => {
      const localId = experience.id.split('::').pop()
      return model.experiences.some(
        other => other.interface !== productInterface.id && other.id.split('::').pop() === localId
      )
    })
    if (owned.length && !mustDivide && !hasCounterpart) {
      warnings.push(
        `${productInterface.file}: holds Experiences but serves one audience through one access mode, and none is a counterpart; use direct Interface availability`
      )
    }
    if (!owned.length && disjointAudiences) {
      warnings.push(
        `${productInterface.file}: serves Actor sets with disjoint Capability coverage; these are Experiences, not one context`
      )
    }
  }

  /*
   * F1 — behavioral ids are verb-object; cross-cutting ids are the bare noun.
   * Ids are the format's whole identity mechanism, so two models of one product
   * that name the same behavior differently cannot be diffed or compared. The
   * check is deliberately a warning: it recognises the nominalisations that
   * signal a noun phrase rather than trying to conjugate English.
   */
  const NOMINALISED = /(?:ing|tion|sion|ment|ance|ence|ity|ness)$/
  // A small vocabulary of product verbs. An id that already contains one reads
  // as verb-object however it ends — `publish-and-share-a-collection` is fine —
  // so only a nominalised id with no verb in it is flagged.
  const PRODUCT_VERBS = new Set([
    'add', 'answer', 'apply', 'approve', 'archive', 'assign', 'block', 'book', 'browse', 'build',
    'cancel', 'change', 'check', 'choose', 'close', 'collect', 'compare', 'complete', 'compose',
    'configure', 'confirm', 'connect', 'contribute', 'create', 'decide', 'decline', 'delete',
    'deliver', 'discover', 'edit', 'enter', 'expire', 'explore', 'export', 'find', 'follow',
    'gate', 'generate', 'grant', 'handle', 'import', 'install', 'invite', 'issue', 'join',
    'keep', 'leave', 'link', 'lint', 'list', 'manage', 'map', 'mark', 'merge', 'move', 'name',
    'open', 'order', 'organize', 'pause', 'pay', 'place', 'plan', 'preserve', 'publish', 'pull',
    'read', 'receive', 'refresh', 'refund', 'reject', 'remove', 'rename', 'reorder', 'reply',
    'report', 'request', 'reset', 'resolve', 'restore', 'resume', 'retry', 'return', 'review',
    'revoke', 'run', 'save', 'schedule', 'search', 'select', 'send', 'serve', 'set', 'settle',
    'share', 'ship', 'show', 'sign', 'start', 'stop', 'submit', 'subscribe', 'switch',
    'synchronize', 'track', 'transfer', 'unfollow', 'unlist', 'update', 'upload', 'verify',
    'view', 'withdraw', 'write'
  ])
  const behavioural: Array<{ file: string, id: string, kind: string }> = [
    ...model.capabilities.map(item => ({ file: item.file, id: item.id, kind: 'Capability' })),
    ...model.journeys.map(item => ({ file: item.file, id: item.id, kind: 'Journey' }))
  ]
  for (const element of behavioural) {
    const segments = element.id.split('-')
    const last = segments[segments.length - 1] || ''
    const carriesVerb = segments.some(segment => PRODUCT_VERBS.has(segment))
    if (NOMINALISED.test(last) && !carriesVerb) {
      warnings.push(
        `${element.file}: ${element.kind} id "${element.id}" reads as a noun phrase; behavioral ids are verb-object`
      )
    }
  }

  /*
   * The model's own noun vocabulary: everything an id can legitimately be about.
   * A qualified id also contributes its last segment, since that is how authors
   * refer to a Screen or Experience in prose.
   */
  const nounVocabulary = new Set<string>()
  for (const element of [...model.entities, ...model.domains, ...model.interfaces, ...model.experiences, ...model.screens]) {
    nounVocabulary.add(element.id)
    const leaf = element.id.split('::').pop()
    if (leaf) nounVocabulary.add(leaf)
  }

  /*
   * Behavioral ids draw their object half from that vocabulary. Two independent
   * mappings of one repository agreed on 95% of the Capabilities they found and
   * shared 29% of the ids, because one wrote `install-skills` where the other
   * wrote `install-agent-skills` and one `lint-model` where the other wrote
   * `lint-product-model`. The concepts matched; the nouns did not. Anchoring the
   * object half to a noun the model already declares removes that whole class of
   * divergence, and only fires when the author has declared the fuller term.
   */
  for (const element of behavioural) {
    const segments = element.id.split('-')
    if (segments.length < 2) continue
    const object = segments.slice(1).join('-')
    if (nounVocabulary.has(object)) continue
    // Suffix only. A declared term that merely *starts* with the object half is
    // usually a different thing — `blueprint-portability` is a Domain, and
    // `contribute-blueprint` is correctly about a blueprint, not about the Domain.
    const fuller = [...nounVocabulary]
      .filter(term => term.endsWith(`-${object}`))
      // Prefer the plain leaf: an id is written unqualified, so suggesting
      // `local-report-web::product-topology` would not be usable as one.
      .sort((left, right) => left.length - right.length)[0]
    if (fuller) {
      warnings.push(
        `${element.file}: ${element.kind} id "${element.id}" names "${object}" where this model declares "${fuller}"; use the declared name`
      )
    }
  }

  /*
   * Cross-cutting ids name something that *is*, so they never open with a verb.
   * A Business Rule states what must remain true and reads as an assertion about
   * a subject, not as a command.
   */
  const nounIdKinds: Array<{ file: string, id: string, kind: string }> = [
    ...model.entities.map(item => ({ file: item.file, id: item.id, kind: 'Entity' })),
    ...model.domains.map(item => ({ file: item.file, id: item.id, kind: 'Domain' })),
    ...model.businessRules.map(item => ({ file: item.file, id: item.id, kind: 'Business Rule' }))
  ]
  for (const element of nounIdKinds) {
    const segments = element.id.split('-')
    // A single-segment id cannot be verb-object; `order` is a noun here even
    // though the same word is a verb elsewhere.
    if (segments.length < 2) continue
    const first = segments[0] || ''
    if (PRODUCT_VERBS.has(first)) {
      warnings.push(
        `${element.file}: ${element.kind} id "${element.id}" opens with a verb; cross-cutting ids name what a thing is, not what is done`
      )
    }
  }

  /*
   * An Entity declares nothing about who uses it. Its edges are declared by the
   * Capability that changes it and the Screen that presents it, and checked here.
   */
  const entityIds = new Set(model.entities.map(item => item.id))
  const changedBy = new Map<string, string[]>()
  for (const capability of model.capabilities) {
    for (const id of capability.entities) {
      if (!entityIds.has(id)) errors.push(`${capability.file}: names missing entity "${id}"`)
      changedBy.set(id, [...(changedBy.get(id) || []), capability.id])
    }
  }
  const presentedOn = new Map<string, string[]>()
  for (const screen of model.screens) {
    for (const id of screen.entities) {
      if (!entityIds.has(id)) errors.push(`${screen.file}: names missing entity "${id}"`)
      presentedOn.set(id, [...(presentedOn.get(id) || []), screen.id])
    }
  }

  for (const entity of model.entities) {
    requireTitle(entity.file, entity.doc.title, entity.doc.lead)
    validateSections(entity.file, entity.doc, ['Intent', 'Information kept', 'States', 'Transitions'])
    if (entity.domain && !domainIds.has(entity.domain)) {
      errors.push(`${entity.file}: names missing domain "${entity.domain}"`)
    }

    /*
     * A transition's cause must be a Capability that admits acting on this
     * Entity. Without the cross-check the two declarations could disagree
     * silently, which is the failure the Screen/Capability check already
     * prevents elsewhere.
     */
    for (const transition of entity.transitions) {
      if (!capabilityIds.has(transition.capability)) {
        errors.push(`${entity.file}: transition "${transition.from} \u2192 ${transition.to}" names missing capability "${transition.capability}"`)
        continue
      }
      const capability = model.capabilities.find(item => item.id === transition.capability)
      if (capability && !capability.entities.includes(entity.id)) {
        errors.push(
          `${entity.file}: transition "${transition.from} \u2192 ${transition.to}" names capability "${transition.capability}", which does not list this Entity`
        )
      }
    }

    // No orphans. Vocabulary nothing points at is either unused or a relation
    // somebody forgot to declare, and both are worth an error.
    if (!(changedBy.get(entity.id) || []).length && !(presentedOn.get(entity.id) || []).length) {
      errors.push(`${entity.file}: no Capability changes it and no Screen presents it`)
    }
  }

  const capabilityAvailability = new Map<string, Set<string>>()
  for (const capability of model.capabilities) {
    requireTitle(capability.file, capability.doc.title, capability.doc.lead)
    validateSections(capability.file, capability.doc, ['Intent'])
    if (!capability.availability.length) errors.push(`${capability.file}: needs at least one availability Context`)
    if (capability.domain && !domainIds.has(capability.domain)) {
      errors.push(`${capability.file}: references missing domain "${capability.domain}"`)
    }
    capabilityAvailability.set(capability.id, validateAvailability(capability.file, capability.availability))
  }

  /* An Experience is authoritative for its audience; an undivided Interface is authoritative for its. */
  const supportedActorsForContainer = (place: string): Set<string> | undefined => {
    const experience = experiencesById.get(place)
    if (experience) return new Set(experience.actors)
    const productInterface = interfacesById.get(place)
    return productInterface ? new Set(productInterface.actors) : undefined
  }

  const screensById = new Map(model.screens.map(screen => [screen.id, screen]))
  const screensByContainer = new Map<string, typeof model.screens>()
  for (const screen of model.screens) {
    const siblings = screensByContainer.get(screen.containerId) || []
    siblings.push(screen)
    screensByContainer.set(screen.containerId, siblings)
  }

  const resolveScenarioContext = (label: string, placeId: string) => {
    if (!placeId) {
      errors.push(`${label}: Context needs a non-empty place id`)
      return undefined
    }
    if (!isQualifiedId(placeId)) {
      errors.push(`${label}: Context place "${placeId}" is not a valid Interface, Experience, or Screen id`)
      return undefined
    }
    const screen = screensById.get(placeId)
    if (screen) return { place: placeId, containerId: screen.containerId, screen }
    const experience = experiencesById.get(placeId)
    if (experience) {
      if ((screensByContainer.get(placeId) || []).length) {
        errors.push(`${label}: Experience "${placeId}" owns Screens, so the Context must name one of its Screens`)
      }
      return { place: placeId, containerId: placeId, screen: undefined }
    }
    const productInterface = interfacesById.get(placeId)
    if (productInterface) {
      if (experienceScopedInterfaces.has(placeId)) {
        errors.push(`${label}: Interface "${placeId}" is divided into Experiences, so the Context must name one of them or one of their Screens`)
      } else if ((screensByContainer.get(placeId) || []).length) {
        errors.push(`${label}: Interface "${placeId}" owns Screens, so the Context must name one of its Screens`)
      }
      return { place: placeId, containerId: placeId, screen: undefined }
    }
    errors.push(`${label}: Context references missing place "${placeId}"`)
    return undefined
  }

  type ScenarioForValidation = typeof model.capabilityScenarios[number] | typeof model.journeyScenarios[number]
  const validateScenarioShape = (
    scenario: ScenarioForValidation,
    implicitCapability?: string,
    journeyActors?: Set<string>
  ) => {
    if (!scenario.routes.length) errors.push(`${scenario.file}: needs at least one route`)
    const routeIds = new Set<string>()
    const routeNames = new Set<string>()
    const routeContextPlaces = new Map<string, string[]>(scenario.routes.map(route => [route.id, []]))
    for (const route of scenario.routes) {
      const label = `${scenario.file}: route "${route.id}"`
      if (!route.id) errors.push(`${scenario.file}: route id must not be empty`)
      else if (!isId(route.id)) errors.push(`${label}: id must be lowercase kebab-case`)
      if (routeIds.has(route.id)) errors.push(`${label}: duplicate route id`)
      routeIds.add(route.id)
      const name = route.name.trim()
      if (!name) errors.push(`${label}: needs a non-empty name`)
      const normalizedName = name.toLocaleLowerCase()
      if (routeNames.has(normalizedName)) errors.push(`${label}: duplicate route name "${route.name}"`)
      routeNames.add(normalizedName)
    }

    if (!scenario.steps.length) errors.push(`${scenario.file}: needs at least one step`)
    const allContextPlaces = new Set<string>()
    const allContainers = new Set<string>()
    const scenarioActors = new Set<string>()
    const capabilitySteps: Array<{ capability: string, contextPlaces: Set<string>, containers: Set<string> }> = []
    for (const [index, step] of scenario.steps.entries()) {
      const label = `${scenario.file}: step ${index + 1}`
      if (!step.text.trim()) errors.push(`${label}: needs non-empty text`)
      if (/\r|\n/.test(step.text)) errors.push(`${label}: text must be a single line`)
      if (!['actor', 'product', 'condition'].includes(step.kind)) {
        errors.push(`${label}: kind "${step.kind}" must be actor|product|condition`)
      }
      if (step.kind === 'actor') {
        if (!step.actor) errors.push(`${label}: an actor Step needs one actor`)
        else {
          scenarioActors.add(step.actor)
          if (!actorIds.has(step.actor)) errors.push(`${label}: references missing actor "${step.actor}"`)
        }
      } else if (step.actor) {
        errors.push(`${label}: actor is only valid when kind is "actor"`)
      }

      const capabilityId = implicitCapability || step.capability
      if (capabilityId) {
        capabilitySteps.push({ capability: capabilityId, contextPlaces: new Set<string>(), containers: new Set<string>() })
        if (!capabilityIds.has(capabilityId)) {
          errors.push(`${label}: references missing capability "${capabilityId}"`)
        }
      }

      if (!step.contexts.length) continue
      const contextualizedRouteIds = new Set<string>()
      for (const context of step.contexts) {
        const contextLabel = `${label}: route "${context.routeId}"`
        if (!routeIds.has(context.routeId)) {
          errors.push(`${contextLabel}: references undeclared route`)
        }
        if (contextualizedRouteIds.has(context.routeId)) errors.push(`${contextLabel}: duplicate Context`)
        contextualizedRouteIds.add(context.routeId)
        routeContextPlaces.get(context.routeId)?.push(context.place)
        const resolved = resolveScenarioContext(contextLabel, context.place)
        if (!resolved) continue
        allContextPlaces.add(resolved.place)
        allContainers.add(resolved.containerId)
        const currentCapabilityStep = capabilityId ? capabilitySteps.at(-1) : undefined
        currentCapabilityStep?.contextPlaces.add(resolved.place)
        currentCapabilityStep?.containers.add(resolved.containerId)
        if (capabilityId) {
          const supported = capabilityAvailability.get(capabilityId) || new Set<string>()
          if (!supported.has(resolved.containerId)) {
            errors.push(`${contextLabel}: Context place "${resolved.place}" is outside capability "${capabilityId}"`)
          }
          if (resolved.screen && !resolved.screen.capabilities.includes(capabilityId)) {
            errors.push(`${contextLabel}: Screen "${resolved.screen.id}" does not expose capability "${capabilityId}"`)
          }
        }
        if (step.kind === 'actor' && step.actor) {
          const supported = supportedActorsForContainer(resolved.containerId) || new Set<string>()
          if (!supported.has(step.actor)) {
            errors.push(`${contextLabel}: Context place does not support actor "${step.actor}"`)
          }
        }
      }
      if (!sameSet(contextualizedRouteIds, routeIds)) {
        errors.push(`${label}: contexts must assign every declared route or be omitted`)
      }
    }

    /*
     * F5 — a Scenario needs an actor Step OR an unattended trigger. Unattended
     * behavior (a schedule the Product owns, an expiry, a retry) is real Product
     * behavior with nobody to name, and requiring an Actor left it uncovered.
     */
    const unattendedTrigger = scenario.steps[0]?.unattended === true
    if (unattendedTrigger && scenario.steps[0]?.kind !== 'condition') {
      errors.push(`${scenario.file}: an unattended trigger must be a condition Step`)
    }
    for (const [index, step] of scenario.steps.entries()) {
      if (index > 0 && step.unattended) {
        errors.push(`${scenario.file}: step ${index + 1}: "unattended" is valid only on the first Step`)
      }
    }
    if (!scenarioActors.size && !unattendedTrigger) {
      errors.push(`${scenario.file}: needs at least one actor Step, or an unattended first condition Step`)
    }
    for (const route of scenario.routes) {
      const sequence = routeContextPlaces.get(route.id) || []
      if (!sequence.length) errors.push(`${scenario.file}: route "${route.id}" must have a Context on at least one Step`)
    }
    const seenSequences = new Map<string, string>()
    for (const route of scenario.routes) {
      const sequence = (routeContextPlaces.get(route.id) || []).join('\n')
      if (!sequence) continue
      const twin = seenSequences.get(sequence)
      if (twin) errors.push(`${scenario.file}: route "${route.id}" repeats every Context place of route "${twin}"`)
      else seenSequences.set(sequence, route.id)
    }

    // An unattended Scenario has no Actor by construction, so "does this place
    // permit the Scenario's Actors" has no answer for it. Its Contexts say where
    // an Actor OBSERVES the outcome, which the Screen/Capability checks already
    // cover.
    const supportedSomewhere = new Set<string>()
    if (!unattendedTrigger) {
      for (const container of allContainers) {
        const supported = supportedActorsForContainer(container) || new Set<string>()
        const participating = [...scenarioActors].filter(actorId => supported.has(actorId))
        if (!participating.length) {
          errors.push(`${scenario.file}: Context place "${container}" permits none of the Scenario Actors`)
        }
        for (const actorId of participating) supportedSomewhere.add(actorId)
      }
    }
    for (const actorId of scenarioActors) {
      if (actorIds.has(actorId) && !supportedSomewhere.has(actorId)) {
        errors.push(`${scenario.file}: actor "${actorId}" is not supported by any selected Context place`)
      }
    }

    if (journeyActors) {
      for (const route of scenario.routes) {
        const firstActorStep = scenario.steps.find(step =>
          step.kind === 'actor' && step.contexts.some(context => context.routeId === route.id)
        )
        if (!firstActorStep?.actor || !journeyActors.has(firstActorStep.actor)) {
          errors.push(`${scenario.file}: route "${route.id}" must begin its contextualized Actor Steps with a Journey Actor`)
        }
      }
    }
    return { allContextPlaces, allContainers, scenarioActors, capabilitySteps }
  }

  const validateScenarioSections = (scenario: {
    file: string
    doc: { title: string, lead: string, sections: Array<{ heading: string, body: string }> }
    kind: string
    trigger: string
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
      ['Goal', 'Success criterion', 'Steps']
    )
    validateListSection(scenario.file, scenario.doc, 'Edge cases', 'bullet')
    if (!scenario.kind || !kindIds.has(scenario.kind)) {
      errors.push(`${scenario.file}: kind "${scenario.kind}" is not defined in taxonomies.yaml`)
    }
    if (!scenario.trigger) errors.push(`${scenario.file}: missing "## Trigger" section`)
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
  const capabilityScenarioContextPlaces = new Map<string, Set<string>>()
  const coveredCapabilityPlaces = new Map<string, Set<string>>()
  for (const scenario of model.capabilityScenarios) {
    validateScenarioSections(scenario)
    if (!scenario.capability) {
      errors.push(`${scenario.file}: needs one capability`)
    } else if (!capabilityIds.has(scenario.capability)) {
      errors.push(`${scenario.file}: references missing capability "${scenario.capability}"`)
    }
    const { allContextPlaces, allContainers } = validateScenarioShape(scenario, scenario.capability)
    capabilityScenarioContextPlaces.set(scenario.id, allContextPlaces)
    const coveredPlaces = coveredCapabilityPlaces.get(scenario.capability) || new Set<string>()
    for (const place of allContainers) coveredPlaces.add(place)
    coveredCapabilityPlaces.set(scenario.capability, coveredPlaces)
    const supported = capabilityAvailability.get(scenario.capability) || new Set<string>()
    for (const place of allContainers) {
      if (!supported.has(place)) {
        errors.push(`${scenario.file}: Context place "${place}" is outside capability "${scenario.capability}"`)
      }
    }
  }
  for (const capability of model.capabilities) {
    const covered = coveredCapabilityPlaces.get(capability.id) || new Set<string>()
    const required = capabilityAvailability.get(capability.id) || new Set<string>()
    for (const place of required) {
      if (covered.has(place)) continue
      const finding = `${capability.file}: availability Context place "${place}" needs Capability Scenario coverage`
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
  const journeyScenarioSteps = new Map<string, Array<{ capability: string, contextPlaces: Set<string>, containers: Set<string> }>>()
  const journeyScenarioActors = new Map<string, Set<string>>()
  for (const scenario of model.journeyScenarios) {
    validateScenarioSections(scenario)
    const journey = journeysById.get(scenario.journey)
    if (!journey) errors.push(`${scenario.file}: references missing journey "${scenario.journey}"`)
    if (!JOURNEY_RESULTS.has(scenario.result)) {
      errors.push(`${scenario.file}: result "${scenario.result}" must be achieved|not-achieved`)
    }
    const journeyActorSet = new Set(journey?.actors || [])
    const { scenarioActors, capabilitySteps } = validateScenarioShape(scenario, undefined, journeyActorSet)
    if (journey && ![...scenarioActors].some(actorId => journeyActorSet.has(actorId))) {
      errors.push(`${scenario.file}: actor Steps must include at least one actor from journey "${scenario.journey}"`)
    }
    if (!capabilitySteps.length) errors.push(`${scenario.file}: needs at least one Capability-bearing step`)
    journeyScenarioSteps.set(scenario.id, capabilitySteps)
    journeyScenarioActors.set(scenario.id, scenarioActors)
    if (scenario.result === 'achieved' && new Set(capabilitySteps.map(item => item.capability)).size < 2) {
      errors.push(`${scenario.file}: an achieved Journey Scenario needs at least two distinct Capabilities`)
    }
  }

  for (const journey of model.journeys) {
    const achievedActorIds = new Set(
      model.journeyScenarios
        .filter(scenario => scenario.journey === journey.id && scenario.result === 'achieved')
        .flatMap(scenario => [...(journeyScenarioActors.get(scenario.id) || [])])
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
      ['Intent', 'Information presented', 'Available actions', 'View states', 'Capability boundary']
    )
    validateListSection(screen.file, screen.doc, 'Information presented', 'bullet')
    validateListSection(screen.file, screen.doc, 'Available actions', 'bullet')
    if (!availabilityPlaceIds.has(screen.containerId)) {
      errors.push(`${screen.file}: containing place "${screen.containerId}" must be an undivided Interface or an Experience`)
    }
    if (!screen.capabilities.length) errors.push(`${screen.file}: needs at least one capability`)
    for (const capabilityId of screen.capabilities) {
      if (!capabilityIds.has(capabilityId)) {
        errors.push(`${screen.file}: references missing capability "${capabilityId}"`)
        continue
      }
      const supported = capabilityAvailability.get(capabilityId) || new Set<string>()
      if (!supported.has(screen.containerId)) {
        errors.push(`${screen.file}: capability "${capabilityId}" is not available in containing place "${screen.containerId}"`)
      }
    }
    validateEntryPointInterfaces(
      screen.file,
      screen.entryPoints,
      new Set([interfaceOf(screen.containerId)])
    )
    if (!screen.information.length) {
      errors.push(`${screen.file}: "## Information presented" needs at least one bullet item`)
    }
    if (!screen.capabilityBoundary) errors.push(`${screen.file}: missing "## Capability boundary" section`)
    if (section(screen.doc, 'Available actions') !== undefined && !screen.actions.length) {
      errors.push(`${screen.file}: "## Available actions" needs at least one bullet item when present`)
    }
    if (section(screen.doc, 'View states') !== undefined && !screen.states.length) {
      errors.push(`${screen.file}: "## Product states" needs at least one H3 state when present`)
    }
    const stateNames = new Set<string>()
    for (const state of screen.states) {
      const normalized = state.title.toLowerCase()
      if (stateNames.has(normalized)) errors.push(`${screen.file}: duplicate view state "${state.title}"`)
      stateNames.add(normalized)
    }
    // A capture that names a state it does not depict is worse than one that
    // names nothing, so the state has to resolve to an authored H3.
    for (const reference of screen.references) {
      if (reference.state === undefined) continue
      if (!stateNames.has(reference.state.toLowerCase())) {
        errors.push(`${screen.file}: reference state "${reference.state}" is not a view state of this Screen`)
      }
    }
  }

  for (const rule of model.businessRules) {
    requireTitle(rule.file, rule.doc.title, rule.doc.lead)
    validateSections(rule.file, rule.doc, ['Intent', 'Rationale'])
    if (!rule.appliesTo.length) errors.push(`${rule.file}: needs at least one appliesTo target`)

    /*
     * F4 — a Rule governs two or more behaviors, or a Context independent of
     * any single behavior. Anything true of exactly one Capability is that
     * Capability's business: a `condition` Step or its Scenario Outcome. A
     * `type: context` target is always fine, since a constraint on an
     * interaction context belongs to no behavior.
     */
    const elementTargets = rule.appliesTo.filter(target => target.type !== 'context')
    const narrowed = elementTargets.some(
      target => 'contexts' in target && Array.isArray(target.contexts) && target.contexts.length > 0
    )
    const hasContextTarget = rule.appliesTo.some(target => target.type === 'context')
    if (elementTargets.length === 1 && !narrowed && !hasContextTarget) {
      const only = elementTargets[0]
      const owner = only && 'id' in only ? only.id : 'that element'
      warnings.push(
        `${rule.file}: governs only "${owner}"; a constraint true of one behavior belongs to it as a condition Step or Outcome, not a Business Rule`
      )
    }
    const seenTargets = new Set<string>()
    const capabilityTargets = new Set<string>()
    const journeyTargets = new Set<string>()
    const capabilityScenarioTargets: string[] = []
    const journeyScenarioTargets: string[] = []
    const directContextPlaces: string[] = []
    for (const [index, target] of rule.appliesTo.entries()) {
      const label = `${rule.file}: appliesTo item ${index + 1}`
      if (target.type === 'context') {
        const place = validateContextPlace(label, target.context)
        const key = `context\0${place}`
        if (seenTargets.has(key)) errors.push(`${label}: duplicate Context target place "${place}"`)
        const overlapping = directContextPlaces.find(existing =>
          existing !== place && (containsPlace(existing, place) || containsPlace(place, existing))
        )
        if (overlapping) {
          errors.push(`${label}: Context target place "${place}" is redundant with "${overlapping}"`)
        }
        seenTargets.add(key)
        directContextPlaces.push(place)
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
        supported = new Set(capabilityAvailability.get(target.id) || [])
        for (const screen of model.screens) {
          if (supported.has(screen.containerId) && screen.capabilities.includes(target.id)) supported.add(screen.id)
        }
      } else if (target.type === 'capability-scenario') {
        if (!capabilityScenarioIds.has(target.id)) errors.push(`${label}: references missing Capability Scenario "${target.id}"`)
        capabilityScenarioTargets.push(target.id)
        supported = capabilityScenarioContextPlaces.get(target.id) || supported
      } else if (target.type === 'journey') {
        if (!journeyIds.has(target.id)) errors.push(`${label}: references missing journey "${target.id}"`)
        journeyTargets.add(target.id)
        for (const scenario of model.journeyScenarios.filter(item => item.journey === target.id && item.result === 'achieved')) {
          for (const entry of journeyScenarioSteps.get(scenario.id) || []) {
            for (const place of entry.contextPlaces) supported.add(place)
          }
        }
      } else {
        if (!journeyScenarioIds.has(target.id)) errors.push(`${label}: references missing Journey Scenario "${target.id}"`)
        journeyScenarioTargets.push(target.id)
        for (const entry of journeyScenarioSteps.get(target.id) || []) {
          for (const place of entry.contextPlaces) supported.add(place)
        }
      }
      const seenContextPlaces: string[] = []
      for (const [contextIndex, context] of target.contexts.entries()) {
        const contextLabel = `${label}: Context ${contextIndex + 1}`
        const place = validateContextPlace(contextLabel, context)
        if (seenContextPlaces.includes(place)) errors.push(`${contextLabel}: duplicate Context place "${place}"`)
        const overlapping = seenContextPlaces.find(existing =>
          existing !== place && (containsPlace(existing, place) || containsPlace(place, existing))
        )
        if (overlapping) {
          errors.push(`${contextLabel}: Context place "${place}" is redundant with "${overlapping}"`)
        }
        seenContextPlaces.push(place)
        if (!supported.has(place) && ![...supported].some(candidate => containsPlace(place, candidate))) {
          errors.push(`${contextLabel}: Context place "${place}" is outside target "${target.type}:${target.id}"`)
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

  const allElements = [
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
    Asset metadata is additive: it titles and describes files that are already
    there, and never sets their class. Class is the path — anything under
    `implementation/` describes this realization — which is the only rule a
    foreign tool writing a capture on CI can actually satisfy.
  */
  for (const element of allElements) {
    const present = new Set(element.assets)
    const stateNames = new Set(
      model.screens.find(screen => screen.file === element.file)?.states.map(state => state.title.toLowerCase()) ?? []
    )
    const isScreen = model.screens.some(screen => screen.file === element.file)
    for (const asset of element.assetMeta) {
      if (!present.has(asset.file)) {
        errors.push(`${element.file}: asset "${asset.file}" is not a file in this element's expanded folder`)
      }
      if (asset.state === undefined) continue
      if (!isScreen) {
        errors.push(`${element.file}: asset "state" is only valid on a Screen`)
      } else if (!stateNames.has(asset.state.toLowerCase())) {
        errors.push(`${element.file}: asset state "${asset.state}" is not a view state of this Screen`)
      }
    }
  }

  const referenceHosts = [{ file: 'product.md', references: model.product.references }, ...allElements]
  const screenFiles = new Set(model.screens.map(screen => screen.file))
  for (const element of referenceHosts) {
    const targets = new Set<string>()
    for (const reference of element.references) {
      if (targets.has(reference.target)) {
        errors.push(`${element.file}: duplicate reference target "${reference.target}"`)
      }
      targets.add(reference.target)
      // Product states are a Screen concept; nowhere else has an H3 set for a
      // state to resolve against, so the key would mean nothing there.
      if (reference.state !== undefined && !screenFiles.has(element.file)) {
        errors.push(`${element.file}: reference "state" is only valid on a Screen`)
      }
      const path = repositoryReferencePath(reference)
      if (!path || tracked.has(path)) continue
      if (reference.kind === 'code') {
        errors.push(`${element.file}: code reference path "${path}" is not a tracked file`)
      } else {
        warnings.push(`${element.file}: reference target "${reference.target}" does not exist in the repository`)
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
      entities: model.entities.length,
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
