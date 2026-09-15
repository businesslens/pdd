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
}

export const resourceNavigationKey: InjectionKey<ResourceNavigation> = Symbol('businesslens:resource-navigation')

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
