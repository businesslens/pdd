/**
 * How many rows sit side by side, per collection.
 *
 * The one thing about a drawing a reader may set: a scanner wants one wide row
 * per resource, a comparer wants three narrow ones. It is a cookie for the
 * same reason the tooltips preference is — a host may render on the server,
 * and the first paint has to be right — and it is keyed by collection, because
 * five Entities and forty Capabilities are not read the same way. The control
 * always says a number: an "Auto" that meant one thing for rows and another
 * for cards told the reader nothing.
 */
import type { ReportResourceKind } from '../utils/reportWorkspace'

export const COLUMN_CHOICES = [1, 2, 3, 4] as const
export type ColumnChoice = typeof COLUMN_CHOICES[number]

type Preference = Partial<Record<ReportResourceKind, number>>

export function useColumns() {
  const preference = useCookie<Preference>('blr-columns', {
    default: () => ({}),
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/'
  })

  /** The reader's choice for this collection, else the drawing's own default. */
  const columnsFor = (kind: ReportResourceKind, fallback: ColumnChoice = 1): ColumnChoice => {
    const value = preference.value?.[kind]
    return COLUMN_CHOICES.includes(value as ColumnChoice) ? value as ColumnChoice : fallback
  }

  const setColumns = (kind: ReportResourceKind, columns: ColumnChoice) => {
    preference.value = { ...preference.value, [kind]: columns }
  }

  return { columnsFor, setColumns }
}
