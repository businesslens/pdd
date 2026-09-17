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
    expect(config).toContain("name: 'businesslens-nuxt-report-viewer-lab'")
    expect(config).toContain("join(currentDir, '../report-viewer')")
    expect(viewerConfig).toContain("resolve('../../layers/nuxt/report-viewer-lab')")
  })

  it('keeps the extension point without retaining decided experiments', () => {
    const readme = readFileSync(join(lab, 'README.md'), 'utf8')

    expect(readme).toContain('The **Table navigation** audition is decided')
    expect(readme).toContain('The **Mutation popover** audition is decided')
    expect(readme).toContain('The **Context sizing** audition is decided')
    for (const name of ['BlrContextPlace', 'BlrContextLabRow', 'BlrContextLabDock']) {
      expect(existsSync(join(lab, `app/components/${name}.vue`))).toBe(false)
    }
    expect(existsSync(join(lab, 'app/composables/useBlrContextLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/assets/context-lab.css'))).toBe(false)
    for (const name of ['BlrScenarioStep', 'BlrStepGuidedReading', 'BlrStepReading', 'BlrStepEffectReading', 'BlrStepCardLabRow', 'BlrMatrixCornerLabRow', 'BlrControlSizeLabRow', 'BlrTopologyMatrix', 'BlrMatrixNavigationLabRow', 'BlrMatrixHandleLabRow', 'BlrMutationBadge', 'BlrMutationPopoverLabRow']) {
      expect(existsSync(join(lab, `app/components/${name}.vue`))).toBe(false)
    }
    expect(existsSync(join(lab, 'app/composables/useBlrStepCardLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/composables/useBlrMatrixNavigationLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/composables/useBlrMatrixCornerLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/assets/matrix-corner-lab.css'))).toBe(false)
    expect(existsSync(join(lab, 'app/composables/useBlrControlSizeLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/plugins/control-size.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/composables/useBlrMutationPopoverLab.ts'))).toBe(false)
    expect(existsSync(join(lab, 'app/assets/mutation-popover-lab.css'))).toBe(false)
    expect(existsSync(join(root, 'layers/nuxt/report-viewer/app/components/BlrScenarioStep.vue'))).toBe(true)
    expect(existsSync(join(lab, 'app/components/BlrResourcePage.vue'))).toBe(false)
    expect(existsSync(join(lab, 'app/utils/labVariants.ts'))).toBe(false)
  })

  it('keeps decided experiments out of the host and the stable report viewer', () => {
    const app = readFileSync(join(root, 'viewer/app/app/app.vue'), 'utf8')
    const stable = readFileSync(join(root, 'layers/nuxt/report-viewer/app/components/BlrTopologyMatrix.vue'), 'utf8')

    expect(app).toContain('<BusinessLensThemeLabBar />')
    expect(app).not.toContain('BlrContextLab')
    expect(app).not.toContain('BlrMutationPopoverLabRow')
    expect(app).not.toContain('useBlrMatrixNavigationLab')
    expect(app).not.toContain('BlrMatrixNavigationLabRow')
    expect(app).not.toContain('BlrMatrixHandleLabRow')
    expect(stable).not.toContain('useBlrMatrixNavigationLab')
    expect(app).not.toContain('BlrMatrixCornerLabRow')
    expect(app).not.toContain('useBlrMatrixCornerLab()')
    expect(stable).not.toContain('useBlrMatrixCornerLab')
    expect(stable).not.toContain('data-navigation-variant')
    expect(stable).not.toContain('data-left-handle-placement')
    expect(app).not.toContain('BlrControlSizeLabRow')
    expect(app).not.toContain('BlrStepCardLabRow')
  })
})
