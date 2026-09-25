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
  if (from && to) return [verb('changed'), state(from, true), { t: 'arrow' }, state(to)]
  return [verb('changed'), ...(to ? [state(to)] : [])]
}

/** What a Rule's Entity target selects: an operation, not yet done, so no tense of its own. */
export interface EntitySelectorLike {
  effect: EntityEffectLike['effect'] | '' | null
  from: string | null
  to: string | null
}

/**
 * A Rule's selector in the words a Step's effect uses, in the present — "change
 * to [Published]", "change [Confirmed] → [Refunded]", "read" — with the same
 * State badges, so an operation a Rule governs reads like the Steps doing it.
 */
export function entitySelectorParts(selector: EntitySelectorLike): EntityEffectPart[] {
  const from = selector.from ?? ''
  const to = selector.to ?? ''
  const state = (text: string, isFrom = false): EntityEffectPart => isFrom ? { t: 'state', text, from: true } : { t: 'state', text }
  const verb = (text: string): EntityEffectPart => ({ t: 'verb', text })
  const moves = (lead: string): EntityEffectPart[] => from && to
    ? [verb(lead), state(from, true), { t: 'arrow' }, state(to)]
    : to ? [verb(`${lead} to`), state(to)] : from ? [verb(`${lead} from`), state(from, true)] : [verb(lead)]
  switch (selector.effect) {
    case 'creates': return [verb('create'), ...(to ? [verb('as'), state(to)] : [])]
    case 'removes': return [verb('remove'), ...(from ? [verb('from'), state(from, true)] : [])]
    case 'reads': return [verb('read')]
    case 'changes': return moves('change')
    default: return from || to ? moves('any operation') : [verb('any operation')]
  }
}
