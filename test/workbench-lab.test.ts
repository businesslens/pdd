import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const lab = join(root, 'layers/nuxt/workbench-lab')
const viewer = join(root, 'layers/nuxt/report-viewer')

function source(path: string): string {
  return readFileSync(join(lab, path), 'utf8')
}

describe('Workbench audition layer', () => {
  /*
    An audition is only useful if it cannot ship. The theme lab is exported
    because the landing application renders it; these alternative readings are
    local comparison material, so the packaged layer must not carry them and no
    consumer should be able to extend them by name.
  */
  it('never leaves the local viewer', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      files: string[]
      exports: Record<string, unknown>
    }

    expect(manifest.files).toContain('!layers/nuxt/workbench-lab')
    expect(Object.keys(manifest.exports)).not.toContain('./nuxt/workbench-lab')
    /* The retired `report-lab` name stays retired; `scripts/check-repo.mjs`
       guards the directory, this guards the export. */
    expect(Object.keys(manifest.exports)).not.toContain('./nuxt/report-lab')

    /* The shipped layer must not reach into the lab in any direction. */
    for (const file of readdirSync(join(viewer, 'app/components'))) {
      expect(readFileSync(join(viewer, 'app/components', file), 'utf8'), file).not.toContain('workbench-lab')
    }

    /* `--ignore-scripts` matters: `prepack` rebuilds `dist/`, and a rebuild
       running inside one test file races every other test file reading it. */
    const packed = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: root,
      encoding: 'utf8'
    })
    expect(packed).not.toContain('layers/nuxt/workbench-lab')
  }, 60_000)

  it('composes on the shipped layer instead of copying it', () => {
    expect(source('nuxt.config.ts')).toContain("join(currentDir, '../report-viewer')")

    /* One reach across, written once, so a variation cannot quietly fork the
       projection it is supposed to be auditioning navigation over. */
    const model = source('app/utils/model.ts')
    expect(model).toContain('../../../report-viewer/app/utils/reportWorkspace')

    for (const file of readdirSync(join(lab, 'app/components'))) {
      const text = readFileSync(join(lab, 'app/components', file), 'utf8')
      if (file === 'BlrLabAtlas.vue') continue /* imports the topology view registry directly */
      expect(text, file).not.toContain('../../../report-viewer/app/utils')
    }
  })

  it('renders the shipped Workbench for its own first reading', () => {
    const entry = source('app/components/BusinessLensReportLab.vue')

    /* Comparing against a copy of the Workbench would compare nothing. */
    expect(entry).toContain('<BusinessLensReportViewer')
    expect(entry).toContain("active.id === 'workbench'")
  })

  it('states what each reading assumes, and what it costs', () => {
    const variants = source('app/utils/workbenchVariants.ts')

    for (const id of ['workbench', 'atlas', 'storyline', 'ledger', 'columns']) {
      expect(variants, id).toContain(`id: '${id}'`)
      expect(existsSync(join(lab, 'app/components')), id).toBe(true)
    }

    /* A comparison where every option claims to be good at everything is not a
       comparison, so `cost` is required alongside `premise`. */
    const premises = variants.match(/premise: '/g)?.length ?? 0
    const costs = variants.match(/cost: '/g)?.length ?? 0
    expect(premises).toBe(5)
    expect(costs).toBe(5)
  })
})
