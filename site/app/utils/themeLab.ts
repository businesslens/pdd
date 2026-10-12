/**
 * Theme variants are an authoring aid and are intentionally limited to a
 * loopback origin. The configuration bit keeps them out of production builds;
 * the hostname check keeps an accidental runtime override from exposing them
 * on a deployed site.
 */
export function themeLabEnabled(configured: unknown, hostname: string): boolean {
  if (configured !== true) return false

  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  return normalized === 'localhost'
    || normalized.endsWith('.localhost')
    || normalized === '127.0.0.1'
    || normalized === '::1'
}

/** Ignore an audition cookie whenever the lab is unavailable. */
export function themeLabChoice(
  enabled: boolean,
  selected: string | null | undefined,
  fallback: string
): string {
  return enabled ? (selected ?? fallback) : fallback
}
