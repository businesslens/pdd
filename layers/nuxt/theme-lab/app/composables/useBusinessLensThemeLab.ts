const THEME_LAB_COOKIE = 'bl-preview-bar'

const cookieOptions = {
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 90
} as const

export function useBusinessLensThemeLab() {
  const cookie = useCookie<string>(THEME_LAB_COOKIE, {
    default: () => 'hidden',
    ...cookieOptions
  })

  const visible = computed(() => cookie.value === 'shown')

  useHead({
    htmlAttrs: {
      'data-businesslens-theme-lab': computed(() => visible.value ? 'shown' : 'hidden')
    }
  })

  function toggle() {
    cookie.value = visible.value ? 'hidden' : 'shown'
  }

  return { visible, toggle }
}
