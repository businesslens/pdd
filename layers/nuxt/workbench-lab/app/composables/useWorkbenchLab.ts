import {
  LAB_DEFAULTS,
  type PageVariantId,
  type PanelVariantId,
  type ScenarioVariantId
} from '../utils/labVariants'

const cookieOptions = {
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 90
} as const

/**
 * Which option each axis is showing.
 *
 * One cookie per axis, so the three vary independently — judging one part at a
 * time is the whole point, and a single combined setting would make it
 * impossible. Cookie-backed for the same reason the background audition is: the
 * choice has to survive the recompile after every edit to the model.
 */
export function useWorkbenchLab() {
  const page = useCookie<PageVariantId>('bl-lab-page', { default: () => LAB_DEFAULTS.page, ...cookieOptions })
  const panel = useCookie<PanelVariantId>('bl-lab-panel', { default: () => LAB_DEFAULTS.panel, ...cookieOptions })
  const scenario = useCookie<ScenarioVariantId>('bl-lab-scenario', {
    default: () => LAB_DEFAULTS.scenario,
    ...cookieOptions
  })

  const values = computed<Record<string, string>>(() => ({
    page: page.value,
    panel: panel.value,
    scenario: scenario.value
  }))

  useHead({
    htmlAttrs: {
      'data-lab-page': computed(() => page.value),
      'data-lab-panel': computed(() => panel.value),
      'data-lab-scenario': computed(() => scenario.value)
    }
  })

  function select(axis: string, id: string) {
    if (axis === 'page') page.value = id as PageVariantId
    if (axis === 'panel') panel.value = id as PanelVariantId
    if (axis === 'scenario') scenario.value = id as ScenarioVariantId
  }

  function reset() {
    page.value = LAB_DEFAULTS.page
    panel.value = LAB_DEFAULTS.panel
    scenario.value = LAB_DEFAULTS.scenario
  }

  return { page, panel, scenario, values, select, reset }
}
