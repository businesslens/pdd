import { themeLabEnabled } from '~/utils/themeLab'

/** Whether this request may expose or apply theme-lab choices. */
export function useThemeLabEnabled(): boolean {
  const { themeLabConfigured } = useRuntimeConfig().public
  return themeLabEnabled(themeLabConfigured, useRequestURL().hostname)
}
