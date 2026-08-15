import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
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
    because the landing application renders it; these variations are local
    comparison material, so the packaged layer must not carry them and no
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

    /* `--ignore-scripts` matters: `prepack` rebuilds `dist/`, and a rebuild
       running inside one test file races every other test file reading it. */
    const packed = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: root,
      encoding: 'utf8'
    })
    expect(packed).not.toContain('layers/nuxt/workbench-lab')
  }, 60_000)

  /*
    The whole point of shadowing is that the Workbench does not know it is being
    auditioned. If the shipped layer ever reaches back, the baseline stops being
    the baseline.
  */
  it('changes nothing in the shipped layer', () => {
    for (const file of readdirSync(join(viewer, 'app/components'))) {
      expect(readFileSync(join(viewer, 'app/components', file), 'utf8'), file)
        .not.toContain('workbench-lab')
    }
    for (const file of readdirSync(join(viewer, 'app/utils'))) {
      expect(readFileSync(join(viewer, 'app/utils', file), 'utf8'), file)
        .not.toContain('workbench-lab')
    }
    expect(source('nuxt.config.ts')).toContain("join(currentDir, '../report-viewer')")
  })

  it('keeps the shipped component as each axis default', () => {
    const peek = source('app/components/BlrEntityPeek.vue')
    const page = source('app/components/BlrEntityPage.vue')

    /* Imported by path, so the default renders what ships rather than a copy. */
    expect(peek).toContain("from '../../../report-viewer/app/components/BlrEntityPeek.vue'")
    expect(peek).toContain("peek === 'zones'")
    expect(page).toContain("from '../../../report-viewer/app/components/BlrEntityPage.vue'")
    expect(page).toContain("page.value === 'scroll' && child.value === 'cards'")
  })

  it('offers five options on each axis, each with a stated cost', () => {
    const variants = source('app/utils/labVariants.ts')

    for (const axis of ['PEEK_AXIS', 'PAGE_AXIS', 'CHILD_AXIS']) {
      expect(variants, axis).toContain(`export const ${axis}`)
    }
    for (const id of ['zones', 'prose', 'spec', 'map', 'bars']) {
      expect(variants, id).toContain(`id: '${id}'`)
    }
    for (const id of ['scroll', 'tabs', 'split', 'anchored', 'accordion']) {
      expect(variants, id).toContain(`id: '${id}'`)
    }
    for (const id of ['cards', 'stepper', 'inline', 'rail']) {
      expect(variants, id).toContain(`id: '${id}'`)
    }

    /* Fifteen options, each declaring what it gives up. An audition where every
       option claims to be good at everything decides nothing. */
    expect(variants.match(/premise: '/g)?.length).toBe(15)
    expect(variants.match(/cost: '/g)?.length).toBe(15)
  })

  /*
    The variations differ in how they draw an entity, never in what they say
    about it — otherwise the comparison is between two summaries rather than two
    visualizations of one.
  */
  it('draws every option from one description of the entity', () => {
    for (const file of ['BlrPeekProse.vue', 'BlrPeekSpec.vue', 'BlrPeekMap.vue', 'BlrPeekBars.vue']) {
      expect(source(`app/components/${file}`), file).toContain("from '../utils/peekFacts'")
    }
    for (const file of ['BlrPageTabs.vue', 'BlrPageSplit.vue', 'BlrPageAnchored.vue', 'BlrPageAccordion.vue', 'BlrPageScroll.vue']) {
      expect(source(`app/components/${file}`), file).toContain("from '../utils/pageSections'")
    }
  })
})

describe('a Scenario page keeps its parent in the trail', () => {
  /*
    `Capability Scenarios › Create an owned collection` named a collection the
    reader never chose and dropped the Capability they arrived from. A defect,
    so it is fixed in the shipped layer rather than auditioned.
  */
  it('walks the containment rather than the collection', () => {
    const workbench = readFileSync(join(viewer, 'app/components/BlrWorkbench.vue'), 'utf8')

    expect(workbench).toContain('const pageTrail = computed<TrailStep[]>')
    expect(workbench).toContain('const collectionKind = parent ? parent.kind : entity.kind')
    expect(workbench).toContain('v-for="(step, index) in pageTrail"')
  })
})
