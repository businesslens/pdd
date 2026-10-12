import type { BlueprintStats } from '~~/shared/blueprints'

export type {
  BlueprintCard,
  BlueprintRecord,
  BlueprintStats
} from '~~/shared/blueprints'

/** The stat row shown on a card and at the top of a record. */
export const BLUEPRINT_STAT_LABELS: Array<{ key: keyof BlueprintStats, label: string }> = [
  { key: 'entities', label: 'Entities' },
  { key: 'capabilities', label: 'Capabilities' },
  { key: 'journeys', label: 'Journeys' },
  { key: 'scenarios', label: 'Scenarios' },
  { key: 'rules', label: 'Rules' }
]

export function pullCommand(slug: string): string {
  return `npx @itai-gendler/pdd-kit@latest blueprint pull ${slug}`
}
