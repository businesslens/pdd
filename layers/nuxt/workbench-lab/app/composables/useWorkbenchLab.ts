import { LAB_DEFAULTS, type ChildVariantId, type PageVariantId, type PeekVariantId } from '../utils/labVariants'

const cookieOptions = {
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 90
} as const

/**
 * Which option each axis is currently showing.
 *
 * One cookie per axis, so the three vary independently — the point of the
 * audition is to judge one part at a time, which a single combined setting
 * would make impossible. Cookie-backed for the same reason the background
 * audition is: the choice has to survive the recompile after every model edit.
 */
export function useWorkbenchLab() {
  const peek = useCookie<PeekVariantId>('bl-lab-peek', { default: () => LAB_DEFAULTS.peek, ...cookieOptions })
  const page = useCookie<PageVariantId>('bl-lab-page', { default: () => LAB_DEFAULTS.page, ...cookieOptions })
  const child = useCookie<ChildVariantId>('bl-lab-child', { default: () => LAB_DEFAULTS.child, ...cookieOptions })

  const values = computed<Record<string, string>>(() => ({
    peek: peek.value,
    page: page.value,
    child: child.value
  }))

  useHead({
    htmlAttrs: {
      'data-lab-peek': computed(() => peek.value),
      'data-lab-page': computed(() => page.value),
      'data-lab-child': computed(() => child.value)
    }
  })

  function select(axis: string, id: string) {
    if (axis === 'peek') peek.value = id as PeekVariantId
    if (axis === 'page') page.value = id as PageVariantId
    if (axis === 'child') child.value = id as ChildVariantId
  }

  function reset() {
    peek.value = LAB_DEFAULTS.peek
    page.value = LAB_DEFAULTS.page
    child.value = LAB_DEFAULTS.child
  }

  return { peek, page, child, values, select, reset }
}
