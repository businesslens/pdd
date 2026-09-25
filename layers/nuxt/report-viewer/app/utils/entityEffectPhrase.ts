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
