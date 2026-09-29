interface NamedEntity { id: string, title: string }

/** The folder and report share the same title-only check and exemptions. */
export function undeclaredEntityMentions(
  text: string,
  entities: NamedEntity[],
  declaredIds: string[],
  actorId: string | null | undefined
): NamedEntity[] {
  const declared = new Set(declaredIds)
  const scrubbed = text.replace(/\bthe Product\b/gi, ' ')
  const titleSpans = (title: string): Array<[number, number]> => {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(?:^|[^a-z0-9])(${escaped}(?:'s|s)?)(?=$|[^a-z0-9])`, 'gi')
    return [...scrubbed.matchAll(pattern)].map(match => {
      const start = match.index + match[0].length - match[1]!.length
      return [start, start + match[1]!.length]
    })
  }
  const covered = entities
    .filter(entity => entity.title && (declared.has(entity.id) || entity.id === actorId))
    .flatMap(entity => titleSpans(entity.title))
  /* The longest title wins: "invitation link" names the Invitation link, not
     also the Invitation, whether or not the longer one is declared. */
  const spans = entities.filter(entity => entity.title).map(entity => ({ id: entity.id, spans: titleSpans(entity.title) }))
  const shadowed = (id: string, [start, end]: [number, number]) => spans.some(other => other.id !== id
    && other.spans.some(([from, to]) => from <= start && end <= to && to - from > end - start))
  return entities.filter(entity => entity.title && !declared.has(entity.id) && entity.id !== actorId
    && titleSpans(entity.title).some(span =>
      !shadowed(entity.id, span) && !covered.some(([from, to]) => from <= span[0] && span[1] <= to)))
}
