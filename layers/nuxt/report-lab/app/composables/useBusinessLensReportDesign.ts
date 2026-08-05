import type { ReportWidth } from '../utils/reportDesigns'
import {
  DEFAULT_REPORT_DESIGN,
  REPORT_DESIGNS,
  REPORT_WIDTHS,
  findReportDesign
} from '../utils/reportDesigns'

const DESIGN_COOKIE = 'bl-report-design'
const WIDTH_COOKIE = 'bl-report-width'

const cookieOptions = {
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 90
} as const

/**
 * The audition selection, persisted the same way the background variants are:
 * a cookie read during SSR and mirrored onto `<html>`, so a reload never flashes
 * the previous design.
 */
export function useBusinessLensReportDesign() {
  const designCookie = useCookie<string>(DESIGN_COOKIE, {
    default: () => DEFAULT_REPORT_DESIGN,
    ...cookieOptions
  })
  const widthCookie = useCookie<string>(WIDTH_COOKIE, {
    default: () => 'auto',
    ...cookieOptions
  })

  const active = computed(() => findReportDesign(designCookie.value))
  const widthChoice = computed<ReportWidth | 'auto'>(() => (
    REPORT_WIDTHS.some(item => item.id === widthCookie.value)
      ? widthCookie.value as ReportWidth | 'auto'
      : 'auto'
  ))
  const width = computed<ReportWidth>(() => (
    widthChoice.value === 'auto' ? active.value.width : widthChoice.value
  ))

  useHead({
    htmlAttrs: {
      'data-report-design': computed(() => active.value.id),
      'data-report-width': computed(() => width.value)
    }
  })

  function selectDesign(id: string) {
    designCookie.value = findReportDesign(id).id
  }

  function selectWidth(id: ReportWidth | 'auto') {
    widthCookie.value = REPORT_WIDTHS.some(item => item.id === id) ? id : 'auto'
  }

  function step(offset: number) {
    const index = REPORT_DESIGNS.findIndex(design => design.id === active.value.id)
    const next = REPORT_DESIGNS[(index + offset + REPORT_DESIGNS.length) % REPORT_DESIGNS.length]!
    selectDesign(next.id)
  }

  return {
    designs: REPORT_DESIGNS,
    widths: REPORT_WIDTHS,
    active,
    width,
    widthChoice,
    selectDesign,
    selectWidth,
    step
  }
}
