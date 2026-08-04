import {
  BUSINESSLENS_DEFAULT_LOCKUP,
  BUSINESSLENS_DEFAULT_LOGO_DISPLAY,
  BUSINESSLENS_DEFAULT_MARK,
  BUSINESSLENS_LOCKUP_VARIANTS,
  BUSINESSLENS_MARK_VARIANTS,
  findBusinessLensLogo,
  type BusinessLensLogoDisplay
} from '../utils/businesslensThemeLabVariants'

const MARK_COOKIE = 'bl-logo-mark'
const LOCKUP_COOKIE = 'bl-logo-lockup'
const DISPLAY_COOKIE = 'bl-logo-display'

const cookieOptions = {
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 90
} as const

export function useBusinessLensLogoVariant() {
  const markCookie = useCookie<string>(MARK_COOKIE, {
    default: () => BUSINESSLENS_DEFAULT_MARK,
    ...cookieOptions
  })
  const lockupCookie = useCookie<string>(LOCKUP_COOKIE, {
    default: () => BUSINESSLENS_DEFAULT_LOCKUP,
    ...cookieOptions
  })
  const displayCookie = useCookie<BusinessLensLogoDisplay>(DISPLAY_COOKIE, {
    default: () => BUSINESSLENS_DEFAULT_LOGO_DISPLAY,
    ...cookieOptions
  })

  const activeMark = computed(() => findBusinessLensLogo(
    BUSINESSLENS_MARK_VARIANTS,
    markCookie.value,
    BUSINESSLENS_DEFAULT_MARK
  ))
  const activeLockup = computed(() => findBusinessLensLogo(
    BUSINESSLENS_LOCKUP_VARIANTS,
    lockupCookie.value,
    BUSINESSLENS_DEFAULT_LOCKUP
  ))
  const display = computed<BusinessLensLogoDisplay>(() => (
    displayCookie.value === 'lockup' ? 'lockup' : 'mark'
  ))

  function selectMark(id: string) {
    markCookie.value = findBusinessLensLogo(
      BUSINESSLENS_MARK_VARIANTS,
      id,
      BUSINESSLENS_DEFAULT_MARK
    ).id
  }

  function selectLockup(id: string) {
    lockupCookie.value = findBusinessLensLogo(
      BUSINESSLENS_LOCKUP_VARIANTS,
      id,
      BUSINESSLENS_DEFAULT_LOCKUP
    ).id
  }

  function setDisplay(next: BusinessLensLogoDisplay) {
    displayCookie.value = next
  }

  return {
    markVariants: BUSINESSLENS_MARK_VARIANTS,
    lockupVariants: BUSINESSLENS_LOCKUP_VARIANTS,
    activeMark,
    activeLockup,
    display,
    selectMark,
    selectLockup,
    setDisplay
  }
}
