import {
  DEFAULT_WORKBENCH_VARIANT,
  findWorkbenchVariant,
  type WorkbenchVariantId
} from '../utils/workbenchVariants'

const VARIANT_COOKIE = 'bl-workbench'

const cookieOptions = {
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 90
} as const

/**
 * Which reading of the model the local viewer is auditioning.
 *
 * Cookie-backed for the same reason the background audition is: the choice has
 * to survive the recompile that follows every edit to the model, and a reader
 * comparing two variations should not have to re-pick after each save.
 */
export function useBusinessLensWorkbenchVariant() {
  const cookie = useCookie<string>(VARIANT_COOKIE, {
    default: () => DEFAULT_WORKBENCH_VARIANT,
    ...cookieOptions
  })

  const active = computed(() => findWorkbenchVariant(cookie.value))

  useHead({
    htmlAttrs: {
      'data-businesslens-workbench': computed(() => active.value.id)
    }
  })

  function select(id: WorkbenchVariantId) {
    cookie.value = findWorkbenchVariant(id).id
  }

  return { active, select }
}
