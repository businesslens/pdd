/** Stable Product-facing interaction contracts supported by an Interface. */
export const INTERFACE_TYPES = [
  'web',
  'mobile-app',
  'desktop-app',
  'cli',
  'api',
  'webhook',
  'messaging',
  'voice',
  'device',
  'agent'
] as const

export type InterfaceType = typeof INTERFACE_TYPES[number]

