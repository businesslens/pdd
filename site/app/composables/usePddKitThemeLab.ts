const THEME_LAB_COOKIE = 'bl-preview-bar'

const cookieOptions = {
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 90
} as const

/**
 * Landing's production-safe override of the shared theme-lab visibility state.
 * Its background controls exist only on an explicitly enabled loopback origin.
 */
export function usePddKitThemeLab() {
  const enabled = useThemeLabEnabled()
  const cookie = useCookie<string>(THEME_LAB_COOKIE, {
    ...cookieOptions
  })

  const visible = computed(() => enabled && cookie.value === 'shown')

  useHead({
    htmlAttrs: {
      'data-pdd-kit-theme-lab': computed(() => visible.value ? 'shown' : 'hidden')
    }
  })

  function toggle() {
    if (!enabled) return
    cookie.value = visible.value ? 'hidden' : 'shown'
  }

  return { enabled, visible, toggle }
}
