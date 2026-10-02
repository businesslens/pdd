interface NamedEntity { id: string, title: string }

/* One pattern per title, built once: lint and report validation ask for every Step. */
const titlePatterns = new Map<string, RegExp>()
function titlePattern(title: string): RegExp {
  let pattern = titlePatterns.get(title)
  if (!pattern) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    pattern = new RegExp(`(?:^|[^a-z0-9])(${escaped}(?:'s|s)?)(?=$|[^a-z0-9])`, 'gi')
    titlePatterns.set(title, pattern)
  }
  return pattern
}

/** The folder and report share the same title-only check and exemptions. */
export function undeclaredEntityMentions(
  text: string,
  entities: NamedEntity[],
  declaredIds: string[],
  actorId: string | null | undefined
): NamedEntity[] {
  const declared = new Set(declaredIds)
  const scrubbed = text.replace(/\bthe Product\b/gi, ' ')
  const spans = entities.filter(entity => entity.title).map(entity => ({
    entity,
    spans: [...scrubbed.matchAll(titlePattern(entity.title))].map((match): [number, number] => {
      const start = match.index + match[0].length - match[1]!.length
      return [start, start + match[1]!.length]
    })
  }))
  const covered = spans
    .filter(({ entity }) => declared.has(entity.id) || entity.id === actorId)
    .flatMap(item => item.spans)
  /* The longest title wins: "invitation link" names the Invitation link, not
     also the Invitation, whether or not the longer one is declared. */
  const shadowed = (id: string, [start, end]: [number, number]) => spans.some(other => other.entity.id !== id
    && other.spans.some(([from, to]) => from <= start && end <= to && to - from > end - start))
  return spans.filter(({ entity, spans: found }) => !declared.has(entity.id) && entity.id !== actorId
    && found.some(span => !shadowed(entity.id, span) && !covered.some(([from, to]) => from <= span[0] && span[1] <= to)))
    .map(item => item.entity)
}
