export type ScenarioRouteColumnPreference = 'auto' | `${number}`

/** Below this width the Step and its selected route read vertically. */
export const SCENARIO_ROUTE_INLINE_WIDTH = 640

/* The table keeps one readable Step column and gives every route enough room
   for a Context path. Capacity follows the component, not the viewport:
   the rail and the Scenario split can make a desktop viewport a narrow read. */
const STEP_COLUMN_WIDTH = 300
const ROUTE_COLUMN_WIDTH = 260

export function scenarioRouteCapacity(width: number, routeCount: number): number {
  if (routeCount <= 0) return 0
  if (width <= 0 || width < SCENARIO_ROUTE_INLINE_WIDTH) return 1
  return Math.min(routeCount, Math.max(1, Math.floor((width - STEP_COLUMN_WIDTH) / ROUTE_COLUMN_WIDTH)))
}

export function scenarioRouteColumnCount(
  width: number,
  routeCount: number,
  preference: string
): number {
  const capacity = scenarioRouteCapacity(width, routeCount)
  if (!capacity) return 0
  if (preference === 'auto') return capacity
  const requested = Number.parseInt(preference, 10)
  return Number.isInteger(requested) && requested > 0
    ? Math.min(requested, capacity)
    : capacity
}

export interface ScenarioRouteWindow<T> {
  start: number
  end: number
  routes: T[]
}

/**
 * Clamp a requested first route so the visible window is always full. Choosing
 * the final route in a two-column view therefore shows the final pair rather
 * than one route and an empty column.
 */
export function scenarioRouteWindow<T extends { id: string }>(
  routes: T[],
  requestedStartId: string | null | undefined,
  count: number
): ScenarioRouteWindow<T> {
  if (!routes.length || count <= 0) return { start: 0, end: 0, routes: [] }
  const visibleCount = Math.min(count, routes.length)
  const requested = routes.findIndex(route => route.id === requestedStartId)
  const maxStart = routes.length - visibleCount
  const start = Math.min(Math.max(0, requested), maxStart)
  const end = start + visibleCount
  return { start, end, routes: routes.slice(start, end) }
}
