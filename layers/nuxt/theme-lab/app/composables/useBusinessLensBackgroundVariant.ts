import {
  BUSINESSLENS_DARK_BACKGROUNDS,
  BUSINESSLENS_DEFAULT_DARK_BACKGROUND,
  BUSINESSLENS_DEFAULT_LIGHT_BACKGROUND,
  BUSINESSLENS_LIGHT_BACKGROUNDS,
  findBusinessLensBackground
} from '../utils/businesslensThemeLabVariants'

const LIGHT_COOKIE = 'bl-bg-light'
const DARK_COOKIE = 'bl-bg-dark'

const cookieOptions = {
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 90
} as const

export function useBusinessLensBackgroundVariant() {
  const lightCookie = useCookie<string>(LIGHT_COOKIE, {
    default: () => BUSINESSLENS_DEFAULT_LIGHT_BACKGROUND,
    ...cookieOptions
  })
  const darkCookie = useCookie<string>(DARK_COOKIE, {
    default: () => BUSINESSLENS_DEFAULT_DARK_BACKGROUND,
    ...cookieOptions
  })

  const activeLight = computed(() => findBusinessLensBackground(
    BUSINESSLENS_LIGHT_BACKGROUNDS,
    lightCookie.value,
    BUSINESSLENS_DEFAULT_LIGHT_BACKGROUND
  ))
  const activeDark = computed(() => findBusinessLensBackground(
    BUSINESSLENS_DARK_BACKGROUNDS,
    darkCookie.value,
    BUSINESSLENS_DEFAULT_DARK_BACKGROUND
  ))

  useHead({
    htmlAttrs: {
      'data-bg-light': computed(() => activeLight.value.id),
      'data-bg-dark': computed(() => activeDark.value.id)
    }
  })

  function selectLight(id: string) {
    lightCookie.value = findBusinessLensBackground(
      BUSINESSLENS_LIGHT_BACKGROUNDS,
      id,
      BUSINESSLENS_DEFAULT_LIGHT_BACKGROUND
    ).id
  }

  function selectDark(id: string) {
    darkCookie.value = findBusinessLensBackground(
      BUSINESSLENS_DARK_BACKGROUNDS,
      id,
      BUSINESSLENS_DEFAULT_DARK_BACKGROUND
    ).id
  }

  return {
    lightBackgrounds: BUSINESSLENS_LIGHT_BACKGROUNDS,
    darkBackgrounds: BUSINESSLENS_DARK_BACKGROUNDS,
    activeLight,
    activeDark,
    selectLight,
    selectDark
  }
}
