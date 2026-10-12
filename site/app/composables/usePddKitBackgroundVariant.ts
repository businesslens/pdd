import {
  PDD_KIT_DARK_BACKGROUNDS,
  PDD_KIT_DEFAULT_DARK_BACKGROUND,
  PDD_KIT_DEFAULT_LIGHT_BACKGROUND,
  PDD_KIT_LIGHT_BACKGROUNDS,
  findPddKitBackground
} from '@itai-gendler/pdd-kit/theme-lab/variants'
import { themeLabChoice } from '~/utils/themeLab'

const LIGHT_COOKIE = 'bl-bg-light'
const DARK_COOKIE = 'bl-bg-dark'

const cookieOptions = {
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 90
} as const

/** Production-safe override of the shared background audition state. */
export function usePddKitBackgroundVariant() {
  const enabled = useThemeLabEnabled()
  const lightCookie = useCookie<string>(LIGHT_COOKIE, {
    ...cookieOptions
  })
  const darkCookie = useCookie<string>(DARK_COOKIE, {
    ...cookieOptions
  })

  const activeLight = computed(() => findPddKitBackground(
    PDD_KIT_LIGHT_BACKGROUNDS,
    themeLabChoice(enabled, lightCookie.value, PDD_KIT_DEFAULT_LIGHT_BACKGROUND),
    PDD_KIT_DEFAULT_LIGHT_BACKGROUND
  ))
  const activeDark = computed(() => findPddKitBackground(
    PDD_KIT_DARK_BACKGROUNDS,
    themeLabChoice(enabled, darkCookie.value, PDD_KIT_DEFAULT_DARK_BACKGROUND),
    PDD_KIT_DEFAULT_DARK_BACKGROUND
  ))

  useHead({
    htmlAttrs: {
      'data-bg-light': computed(() => activeLight.value.id),
      'data-bg-dark': computed(() => activeDark.value.id)
    }
  })

  function selectLight(id: string) {
    if (!enabled) return
    lightCookie.value = findPddKitBackground(
      PDD_KIT_LIGHT_BACKGROUNDS,
      id,
      PDD_KIT_DEFAULT_LIGHT_BACKGROUND
    ).id
  }

  function selectDark(id: string) {
    if (!enabled) return
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
