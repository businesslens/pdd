import type { InjectionKey, Ref } from 'vue'
import type { ReportReference } from 'businesslens/report'

export const isExternalReference = (target: string) => /^https?:\/\//i.test(target)

export const referenceFileHref = (target: string) => `/_businesslens/file/${target.split('/').map(encodeURIComponent).join('/')}`
export const referenceHref = (reference: ReportReference) => isExternalReference(reference.target)
  ? reference.target : reference.kind === 'code'
    ? `/_businesslens/code?target=${encodeURIComponent(reference.target)}#reference` : referenceFileHref(reference.target)

/** Only the local viewer's inert reference endpoints may be loaded into a reading. */
export function localReferenceHref(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/_businesslens/')) return null
  try {
    const url = new URL(value, 'http://businesslens.local')
    return url.origin === 'http://businesslens.local'
      && (url.pathname === '/_businesslens/code' || url.pathname.startsWith('/_businesslens/file/'))
      ? `${url.pathname}${url.search}${url.hash}` : null
  } catch { return null }
}

export interface ReferenceVisit { href: string | null, position: number }
export function referenceTrail(value: unknown): ReferenceVisit[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is ReferenceVisit => Boolean(item && Number.isInteger(item.position)
    && (item.href === null || localReferenceHref(item.href))))
}

export interface ReferenceNavigation {
  current: Ref<string | null>
  previous: Ref<string | null>
  href: (href: string) => string
  open: (href: string) => void
  back: () => void
}
export const referenceNavigationKey: InjectionKey<ReferenceNavigation> = Symbol('businesslens:reference-navigation')
