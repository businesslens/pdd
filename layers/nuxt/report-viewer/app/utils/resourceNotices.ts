import type { InjectionKey, Ref } from 'vue'

/** A host's note about one resource, shown above its reading. */
export interface ReportResourceNotice {
  title: string
  description: string
  /** A secondary line, such as the file the notice is about. */
  detail?: string
}

export const RESOURCE_NOTICES: InjectionKey<Ref<Record<string, ReportResourceNotice>>> = Symbol('businesslens:resource-notices')
