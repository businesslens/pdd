import type { InjectionKey, Ref } from 'vue'

export interface ResourceVisit {
  resource: string
  tab: string
  position: number
}

/** Router support is optional for hosts that embed an uncontrolled reader. */
export interface ResourceNavigation {
  href: (resource: string, tab?: string) => string
  previous: Ref<ResourceVisit | null>
  back: () => void
  /** The next change of resource replaces the reading: no history entry, no Back step. */
  replace?: () => void
}

export const resourceNavigationKey: InjectionKey<ResourceNavigation> = Symbol('businesslens:resource-navigation')

export interface ResourceOpenOptions {
  /** Switching between a Variation's alternatives keeps the same title, so it replaces the reading. */
  replace?: boolean
}

/** Open a resource at one of its readings — `lifecycle/<change>` included. The report shell provides it. */
export const resourceOpenerKey: InjectionKey<(key: string, tab?: string, options?: ResourceOpenOptions) => void> = Symbol('businesslens:resource-opener')

/**
 * A resource reading change that is a new place for Back. Letting go of a
 * reading's detail — `lifecycle/<change>` settling to `lifecycle` once the
 * change is shown — stays on the same entry, so a pasted change link never
 * leaves Back pointing at itself.
 */
export function resourceTabPushesHistory(before: { resource: string | null, resourceTab: string }, next: { resource: string | null, resourceTab: string }): boolean {
  if (before.resourceTab === next.resourceTab) return false
  return !(before.resource === next.resource && before.resourceTab.startsWith(`${next.resourceTab}/`))
}

export function resourceTrail(value: unknown): ResourceVisit[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is ResourceVisit => Boolean(item && typeof item.resource === 'string'
    && typeof item.tab === 'string' && Number.isInteger(item.position)))
}

/** A tab change keeps the trail; another resource records the reading we left. */
export function nextResourceTrail(trail: ResourceVisit[], before: ResourceVisit | null, resource: string | null, sameSurface: boolean): ResourceVisit[] {
  if (!resource || !sameSurface) return []
  if (!before || before.resource === resource) return trail
  return [...trail, before]
}
