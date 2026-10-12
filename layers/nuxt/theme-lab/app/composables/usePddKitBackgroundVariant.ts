import {
  PDD_KIT_DARK_BACKGROUNDS,
  PDD_KIT_DEFAULT_DARK_BACKGROUND,
  PDD_KIT_DEFAULT_LIGHT_BACKGROUND,
  PDD_KIT_LIGHT_BACKGROUNDS,
  findPddKitBackground
} from '../utils/pddKitThemeLabVariants'

const LIGHT_COOKIE = 'bl-bg-light'
const DARK_COOKIE = 'bl-bg-dark'

const cookieOptions = {
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 90
} as const

export function usePddKitBackgroundVariant() {
  const lightCookie = useCookie<string>(LIGHT_COOKIE, {
    default: () => PDD_KIT_DEFAULT_LIGHT_BACKGROUND,
    ...cookieOptions
  })
  const darkCookie = useCookie<string>(DARK_COOKIE, {
    default: () => PDD_KIT_DEFAULT_DARK_BACKGROUND,
    ...cookieOptions
  })

  const activeLight = computed(() => findPddKitBackground(
    PDD_KIT_LIGHT_BACKGROUNDS,
    lightCookie.value,
    PDD_KIT_DEFAULT_LIGHT_BACKGROUND
  ))
  const activeDark = computed(() => findPddKitBackground(
    PDD_KIT_DARK_BACKGROUNDS,
    darkCookie.value,
    PDD_KIT_DEFAULT_DARK_BACKGROUND
  ))

  useHead({
    htmlAttrs: {
      'data-bg-light': computed(() => activeLight.value.id),
      'data-bg-dark': computed(() => activeDark.value.id)
    }
  })

  function selectLight(id: string) {
    lightCookie.value = findPddKitBackground(
      PDD_KIT_LIGHT_BACKGROUNDS,
      id,
      PDD_KIT_DEFAULT_LIGHT_BACKGROUND
    ).id
  }

  function selectDark(id: string) {
    darkCookie.value = findPddKitBackground(
      PDD_KIT_DARK_BACKGROUNDS,
      id,
      PDD_KIT_DEFAULT_DARK_BACKGROUND
    ).id
  }

  return {
    lightBackgrounds: PDD_KIT_LIGHT_BACKGROUNDS,
    darkBackgrounds: PDD_KIT_DARK_BACKGROUNDS,
    activeLight,
    activeDark,
    selectLight,
    selectDark
  }
}
