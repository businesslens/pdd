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
  return entities.filter(entity => entity.title && !declared.has(entity.id) && entity.id !== actorId
    && titleSpans(entity.title).some(([start, end]) =>
      !covered.some(([from, to]) => from <= start && end <= to)))
}
