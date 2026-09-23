/**
 * What happened to an Entity, in the words that follow its chip.
 *
 * The Entity always comes first and is drawn apart, so one phrase reads the
 * same in a Step and in an ending: `[Source] created [Reachable]`. A verb is a
 * plain word; a State is a badge, because it is a value the thing holds and
 * never a second resource.
 */
export type EntityEffectPart =
  | { t: 'verb', text: string }
  | { t: 'state', text: string, from?: boolean }
  | { t: 'arrow' }

export interface EntityEffectLike {
  effect: 'creates' | 'changes' | 'removes' | 'reads'
  from: string
  to: string
  /** A run of changes through these States, `from` first and `to` last. */
  path?: string[]
}

/**
 * An ending says where a thing was left, so it names no starting State and
 * a change reads as the State it rests `in`.
 */
export function entityEffectParts(mention: EntityEffectLike, outcome = false): EntityEffectPart[] {
  const { effect, from, to } = mention
  const state = (text: string, isFrom = false): EntityEffectPart => isFrom ? { t: 'state', text, from: true } : { t: 'state', text }
  const verb = (text: string): EntityEffectPart => ({ t: 'verb', text })
  if (effect === 'reads') return [verb('read')]
  if (effect === 'creates') return [verb('created'), ...(to ? [state(to)] : [])]
  if (effect === 'removes') return [verb('removed'), ...(from && !outcome ? [verb('from'), state(from, true)] : [])]
  if (outcome) return to ? [verb('in'), state(to)] : [verb('changed')]
  if (mention.path && mention.path.length > 2) {
    return [verb('changed'), ...mention.path.flatMap((name, index): EntityEffectPart[] => index ? [{ t: 'arrow' }, state(name)] : [state(name, true)])]
  }
  if (from && to) return [verb('changed'), state(from, true), { t: 'arrow' }, state(to)]
  return [verb('changed'), ...(to ? [state(to)] : [])]
}

/**
 * A set of moves read as runs: a change that starts where another ends joins
 * it, so `Unread → Read` and `Read → Unread` read `Unread → Read → Unread`
 * and no State is named twice in a row. A run starts at a State no other move
 * leads into, else at the first authored move; each run takes the place of
 * its first move, so the authored order holds. Creations, removals and changes
 * without both States stay as they are.
 */
export function joinStateMoves<T extends EntityEffectLike>(effects: T[]): EntityEffectLike[] {
  const isMove = (item: EntityEffectLike) => item.effect === 'changes' && Boolean(item.from && item.to)
  const unused = effects.map((item, index) => ({ item, index })).filter(entry => isMove(entry.item))
  const runAt = new Map<number, EntityEffectLike>()
  const joined = new Set<number>()
  while (unused.length) {
    const start = Math.max(0, unused.findIndex(entry => !unused.some(other => other !== entry && other.item.to === entry.item.from)))
    const [first] = unused.splice(start, 1)
    const path = [first!.item.from, first!.item.to]
    let lowest = first!.index
    for (let next = unused.findIndex(entry => entry.item.from === path.at(-1)); next >= 0; next = unused.findIndex(entry => entry.item.from === path.at(-1))) {
      const [entry] = unused.splice(next, 1)
      path.push(entry!.item.to)
      joined.add(entry!.index)
      lowest = Math.min(lowest, entry!.index)
    }
    joined.add(first!.index)
    runAt.set(lowest, path.length > 2 ? { effect: 'changes', from: path[0]!, to: path.at(-1)!, path } : first!.item)
  }
  return effects.flatMap((item, index) => runAt.has(index) ? [runAt.get(index)!] : joined.has(index) ? [] : [item])
}
