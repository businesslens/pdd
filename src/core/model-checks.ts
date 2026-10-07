/**
 * Checks folder `lint` and report validation both make, written once so the
 * two cannot drift. Each returns messages without the caller's label; the
 * caller prefixes its own file or resource label.
 */

/**
 * A language tag: `en`, `de-DE`, `pt-BR`. A closed vocabulary, never a name.
 * The shape is checked here; the list against i18n configuration is `verify`'s.
 */
export const LANGUAGE_TAG_PATTERN = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/

export function isLanguageTag(tag: string): boolean {
  return LANGUAGE_TAG_PATTERN.test(tag)
}

/**
 * An Interface narrows the Product's languages; it never adds one. `product`
 * names where the Product's list is declared.
 */
export function interfaceLanguageIssues(
  languages: readonly string[],
  productLanguages: ReadonlySet<string>,
  product: string
): string[] {
  const issues: string[] = []
  if (languages.length && !productLanguages.size) issues.push(`lists languages, and ${product} declares none`)
  for (const tag of languages) {
    if (productLanguages.size && !productLanguages.has(tag)) issues.push(`language "${tag}" is not one of the Product's languages`)
  }
  return issues
}

interface FactHolder {
  informationKept: readonly { name: string }[]
}

/** Every named fact must be one the Entity keeps, by the Entity's own name for it. */
export function unknownFactIssues(entityId: string, facts: readonly string[], entity: FactHolder): string[] {
  return facts
    .filter(fact => !entity.informationKept.some(item => item.name === fact))
    .map(fact => `"${fact}" is not a fact of entity "${entityId}"`)
}

/**
 * A Screen names the facts on screen by the Entity's own names, so the claim is
 * checkable against the Entity and against every Rule and Step that cites the
 * same fact. An Entity that keeps facts is never presented without naming some.
 */
export function screenEntityIssues(
  entityId: string,
  entry: { shows: readonly string[], collects: readonly string[] },
  entity: FactHolder
): string[] {
  const issues = unknownFactIssues(entityId, [...entry.shows, ...entry.collects], entity)
  if (!entry.shows.length && !entry.collects.length && entity.informationKept.length) {
    issues.push(`presents "${entityId}" without naming its facts; a Screen says which facts it shows or collects`)
  }
  return issues
}

/**
 * An actor Step placed on a Screen reads only what that Screen presents, and
 * only the facts it shows. An Actor read without facts is the Actor itself.
 */
export function screenReadIssues(
  screenId: string,
  presented: ReadonlyMap<string, { shows: readonly string[] }>,
  step: { kind: string, entities: readonly { entityId: string, effect: string, facts: readonly string[] }[] },
  actorIds: ReadonlySet<string>
): string[] {
  const issues: string[] = []
  if (step.kind !== 'actor') return issues
  for (const entry of step.entities) {
    if (entry.effect !== 'reads' || (actorIds.has(entry.entityId) && !entry.facts.length)) continue
    const shown = presented.get(entry.entityId)
    if (!shown) {
      issues.push(`reads "${entry.entityId}" on Screen "${screenId}", which does not present it`)
      continue
    }
    for (const fact of entry.facts) {
      if (!shown.shows.includes(fact)) {
        issues.push(`reads "${fact}" of "${entry.entityId}" on Screen "${screenId}", which does not show that fact`)
      }
    }
  }
  return issues
}

/** One declared relation, read source to target, as both callers hold it. */
export interface RelationEdge {
  from: string
  to: string
  cardinality: string
}

export interface ConditionInstance {
  /** The Entity a grant condition names through `entity`. */
  entityId: string
  /** The grant's `actors`. Only a grant admitting exactly one Entity fixes who acts. */
  actorIds: readonly string[]
  /** Every Entity the grant's `related` path passes through, in order; the last one acts. */
  pathIds: readonly string[]
  /** The Rule's one Entity target, when it has exactly one. */
  targetId: string | undefined
  singletonIds: ReadonlySet<string>
  relations: readonly RelationEdge[]
}

/*
 * The hops along which an instance has exactly one of the next: from the
 * `many` side of a `one-to-many` back to its one, and both ways along a
 * `one-to-one`. A self-relation is never walked, because naming the Entity does
 * not give it a direction. A pair joined twice keeps both hops, so a walk
 * through it can be told apart from one through a single relation.
 */
function toOneHops(relations: readonly RelationEdge[]): Map<string, string[]> {
  const hops = new Map<string, string[]>()
  const add = (from: string, to: string) => hops.set(from, [...(hops.get(from) ?? []), to])
  for (const relation of relations) {
    if (relation.from === relation.to) continue
    if (relation.cardinality === 'one-to-many') add(relation.to, relation.from)
    if (relation.cardinality === 'one-to-one') {
      add(relation.from, relation.to)
      add(relation.to, relation.from)
    }
  }
  return hops
}

function reachableFrom(start: string, hops: Map<string, string[]>): Set<string> {
  const reached = new Set([start])
  const pending = [start]
  while (pending.length) {
    for (const next of hops.get(pending.pop()!) ?? []) {
      if (!reached.has(next)) {
        reached.add(next)
        pending.push(next)
      }
    }
  }
  return reached
}

/**
 * A grant condition naming another Entity must read one instance of it: the
 * acting one, the one on the `related` path, the one the targeted instance has
 * through to-one relations, or the Product's one `singleton`. A condition that
 * could read any of many instances says nothing, so `lint` refuses it.
 */
export function conditionInstanceIssue(condition: ConditionInstance): string | undefined {
  const { entityId, targetId } = condition
  /* A path that passes the target's own type again reads that instance — the
     acting person's membership, never the one being changed. */
  const acting = condition.pathIds.at(-1) ?? (condition.actorIds.length === 1 ? condition.actorIds[0] : undefined)
  if (entityId === acting || condition.pathIds.includes(entityId) || condition.singletonIds.has(entityId)) {
    return undefined
  }
  if (entityId === targetId) {
    return `names "${entityId}", the Rule's own target; a condition on the governed thing names no "entity"`
  }
  const ways = 'walk to it with "related", relate it to-one, or declare it "singleton"'
  const several = condition.actorIds.includes(entityId)
    ? `; the grant admits more than one Entity, so give "${entityId}" a grant of its own`
    : ''
  const unreached = `reads "${entityId}", which is not the acting Entity, lies off the grant's "related" path and is not "singleton"`
  if (targetId === undefined) return `${unreached}, and the Rule has no one Entity target to reach it from${several || `; ${ways}`}`

  /* Two walks through different Entities are the model saying they meet at
     one instance — a Habit's and its Reflection's Owner — which only `verify`
     can hold against code. Two relations joining the same pair never meet: an
     Account that sends and receives Transfers is two Accounts. */
  const hops = toOneHops(condition.relations)
  const reached = reachableFrom(targetId, hops)
  if (!reached.has(entityId)) return `${unreached}, and no to-one relation reaches it from "${targetId}"${several || `; ${ways}`}`
  for (const from of reached) {
    const nexts = hops.get(from) ?? []
    const twice = nexts.find((next, index) => nexts.indexOf(next) !== index)
    if (twice !== undefined && reachableFrom(twice, hops).has(entityId)) {
      return `reads "${entityId}" through "${from}" and "${twice}", which two relations join, so which one it reads is unclear; walk to it with "related"`
    }
  }
  return undefined
}

/**
 * A `singleton` is one instance, so it is never a relation's `many` end: the
 * target of a `one-to-many`, or either end of a `many-to-many`.
 */
export function singletonRelationIssue(relation: RelationEdge, singletonIds: ReadonlySet<string>): string | undefined {
  const many = relation.cardinality === 'many-to-many'
    ? [relation.from, relation.to]
    : relation.cardinality === 'one-to-many' ? [relation.to] : []
  const single = many.find(id => singletonIds.has(id))
  return single === undefined
    ? undefined
    : `is ${relation.cardinality}, but "${single}" is singleton and there is only one`
}
