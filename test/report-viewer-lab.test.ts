import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const lab = join(root, 'layers/nuxt/report-viewer-lab')

describe('private Product Report viewer lab', () => {
  it('remains a local-only extension of the stable report viewer', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    const config = readFileSync(join(lab, 'nuxt.config.ts'), 'utf8')
    const viewerConfig = readFileSync(join(root, 'viewer/app/nuxt.config.ts'), 'utf8')

    expect(pkg.files).toContain('!layers/nuxt/report-viewer-lab')
    expect(pkg.exports['./nuxt/report-viewer-lab']).toBeUndefined()
    expect(config).toContain("name: 'pdd-kit-nuxt-report-viewer-lab'")
    expect(config).toContain("join(currentDir, '../report-viewer')")
    expect(viewerConfig).toContain("resolve('../../layers/nuxt/report-viewer-lab')")
  })

  it('keeps the extension point without retaining decided experiments', () => {
    const readme = readFileSync(join(lab, 'README.md'), 'utf8')

    expect(readme).toContain('There are no active report experiments in this layer.')
    expect(readme).toContain('The **Variation mark** audition is decided')
    for (const file of ['utils/variationMarkLab.ts', 'composables/useReportVariationMarkLab.ts', 'components/ReportVariationMarkLabRow.vue', 'assets/variation-mark-lab.css']) {
      expect(existsSync(join(lab, 'app', file))).toBe(false)
    }

    expect(readme).toContain('The **Resource heading** audition is decided')
    for (const file of ['components/ReportResourceHeading.vue', 'components/ReportHeadingDomains.vue', 'components/ReportHeadingLabRow.vue', 'composables/useReportHeadingLab.ts', 'utils/headingLab.ts']) {
      expect(existsSync(join(lab, 'app', file))).toBe(false)
    }
    expect(readme).toContain('The **Entity effect** audition is decided')
    for (const file of ['components/ReportStepEntity.vue', 'components/ReportEffectPhrasingLabRow.vue', 'composables/useReportEffectPhrasingLab.ts', 'utils/effectPhrasingLab.ts']) {
      expect(existsSync(join(lab, 'app', file))).toBe(false)
    }
    expect(readme).toContain('The **View controls** audition is decided')
    for (const file of ['components/ReportCollectionControls.vue', 'components/ReportDrawingPreview.vue', 'components/ReportDrawingRowTools.vue', 'components/ReportDrawingControlsLabRow.vue', 'composables/useReportDrawingControlsLab.ts', 'utils/drawingControlsLab.ts', 'assets/drawing-controls-lab.css']) {
      expect(existsSync(join(lab, 'app', file))).toBe(false)
    }
    expect(readme).toContain('The **Table navigation** audition is decided')
    expect(readme).toContain('The **Mutation popover** audition is decided')
    expect(readme).toContain('The **Context sizing** audition is decided')
    expect(readme).toContain('The **Comparison legend** audition is decided')
    for (const name of ['ReportMatrixLegend', 'ReportMatrixLegendLabRow']) {
      expect(existsSync(join(lab, `app/components/${name}.vue`))).toBe(false)
    }
    expect(existsSync(join(lab, 'app/composables/useReportMatrixLegendLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/assets/matrix-legend-lab.css'))).toBe(false)
    for (const name of ['ReportContextPlace', 'ReportContextLabRow', 'ReportContextLabDock']) {
      expect(existsSync(join(lab, `app/components/${name}.vue`))).toBe(false)
    }
    expect(existsSync(join(lab, 'app/composables/useReportContextLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/assets/context-lab.css'))).toBe(false)
    for (const name of ['ReportScenarioStep', 'ReportStepGuidedReading', 'ReportStepReading', 'ReportStepEffectReading', 'ReportStepCardLabRow', 'ReportMatrixCornerLabRow', 'ReportControlSizeLabRow', 'ReportTopologyMatrix', 'ReportMatrixNavigationLabRow', 'ReportMatrixHandleLabRow', 'ReportMutationBadge', 'ReportMutationPopoverLabRow', 'ReportSidebarIconSizeLabRow', 'ReportProductPickerLabRow']) {
      expect(existsSync(join(lab, `app/components/${name}.vue`))).toBe(false)
    }
    expect(existsSync(join(lab, 'app/composables/useReportStepCardLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/composables/useReportMatrixNavigationLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/composables/useReportMatrixCornerLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/assets/matrix-corner-lab.css'))).toBe(false)
    expect(existsSync(join(lab, 'app/composables/useReportControlSizeLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/composables/useReportSidebarIconSizeLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/composables/useReportProductPickerVariant.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/assets/sidebar-icon-size.css'))).toBe(false)
    expect(existsSync(join(lab, 'app/assets/product-picker-lab.css'))).toBe(false)
    expect(existsSync(join(lab, 'app/plugins/control-size.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/composables/useReportMutationPopoverLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/assets/mutation-popover-lab.css'))).toBe(false)
    expect(existsSync(join(root, 'layers/nuxt/report-viewer/app/components/ReportScenarioStep.vue'))).toBe(true)
    expect(existsSync(join(lab, 'app/components/ReportResourcePage.vue'))).toBe(false)
    expect(existsSync(join(lab, 'app/utils/labVariants.ts'))).toBe(false)
  })

  it('keeps decided experiments out of the host and the stable report viewer', () => {
    const app = readFileSync(join(root, 'viewer/app/app/app.vue'), 'utf8')
    const stable = readFileSync(join(root, 'layers/nuxt/report-viewer/app/components/ReportTopologyMatrix.vue'), 'utf8')

    expect(app).toMatch(/<PddKitThemeLabBar(?:\s|>)/)
    expect(app).not.toContain('ReportProductPickerLabRow')
    expect(app).not.toContain('useReportProductPickerVariant')
    expect(app).not.toContain('ReportSidebarIconSizeLabRow')
    expect(app).not.toContain('useReportSidebarIconSizeLab')
    expect(app).not.toContain('ReportMatrixLegendLabRow')
    expect(app).not.toContain('ReportContextLab')
    expect(app).not.toContain('ReportMutationPopoverLabRow')
    expect(app).not.toContain('useReportMatrixNavigationLab')
    expect(app).not.toContain('ReportMatrixNavigationLabRow')
    expect(app).not.toContain('ReportMatrixHandleLabRow')
    expect(stable).not.toContain('useReportMatrixNavigationLab')
    expect(app).not.toContain('ReportMatrixCornerLabRow')
    expect(app).not.toContain('useReportMatrixCornerLab()')
    expect(stable).not.toContain('useReportMatrixCornerLab')
    expect(stable).not.toContain('data-navigation-variant')
    expect(stable).not.toContain('data-left-handle-placement')
    expect(app).not.toContain('ReportControlSizeLabRow')
    expect(app).not.toContain('ReportStepCardLabRow')
    expect(app).not.toContain('ReportDrawingControlsLabRow')
    expect(app).not.toContain('ReportEffectPhrasingLabRow')
    expect(app).not.toContain('ReportHeadingLabRow')
    expect(app).not.toContain('ReportVariationMarkLabRow')
    expect(app).not.toContain(':row-count="2"')
  })
})
