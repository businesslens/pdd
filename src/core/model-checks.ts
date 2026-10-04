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
