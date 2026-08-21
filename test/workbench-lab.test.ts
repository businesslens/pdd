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

  /*
    The page and the slideover render one component. A panel that quietly showed
    different facts from the page is what made the old peek hard to trust, and
    only a shared reading rules it out structurally.
  */
  it('reads an entity once, in two containers', () => {
    const page = source('app/components/BlrEntityPage.vue')
    const panel = source('app/components/BlrInspector.vue')

    expect(page).toContain('<BlrEntityReading')
    expect(panel).toContain('<BlrEntityReading')
    expect(panel).toContain('compact')
    /* The panel always offers the other container. */
    expect(panel).toContain('Open as page')
    /* `none` forwards straight to the page rather than rendering an empty one. */
    expect(panel).toContain("panel.value === 'none'")
  })

  /*
    A Scenario has no page of its own. Reaching one lands on its parent with the
    Scenario chosen, which is what removed the third level of navigation.
  */
  it('reads a Scenario inside its parent', () => {
    const reading = source('app/components/BlrEntityReading.vue')

    expect(reading).toContain('const parent = computed(() => parentOf(props.workspace, props.entity))')
    expect(reading).toContain('const subject = computed(() => parent.value ?? props.entity)')
    expect(reading).toContain("active.value = 'scenarios'")
    expect(source('app/components/BlrScenarios.vue')).not.toContain('emit(\'open\'')
  })

  /*
    Detail, Connections and Also-on are what an overview *is*. As peers they
    made four thin tabs; the audition is over how far to take the merge, not
    whether to.
  */
  it('keeps Detail, Connections and Also-on inside the Overview', () => {
    const sections = source('app/utils/pageSections.ts')

    expect(sections).toContain("overviewBlocks.push('connections')")
    expect(sections).toContain("overviewBlocks.push('counterparts')")
    expect(sections).toContain("if (options.detailApart) detailBlocks.push('detail')")
    expect(sections).toContain("else overviewBlocks.push('detail')")
  })

  it('keeps Journey Steps in Scenarios instead of adding a lossy Flows tab', () => {
    const sections = source('app/utils/pageSections.ts')
    const reading = source('app/components/BlrEntityReading.vue')

    expect(sections).not.toContain("label: entity.kind === 'journey' ? 'Flows'")
    expect(sections).not.toContain("entity.kind === 'journey' || GRAPH_LED.includes(entity.kind)")
    expect(reading).not.toContain('buildJourneyAnatomy')
    expect(reading).not.toContain('journeyFlow')
    expect(reading).toContain('<BlrScenarios')
  })

  it('offers five options on each axis, each with a stated cost', () => {
    const variants = source('app/utils/labVariants.ts')

    for (const axis of ['PAGE_AXIS', 'PANEL_AXIS', 'SCENARIO_AXIS']) {
      expect(variants, axis).toContain(`export const ${axis}`)
    }
    for (const id of ['two', 'three', 'vertical', 'disclosed', 'dense']) {
      expect(variants, id).toContain(`id: '${id}'`)
    }
    for (const id of ['narrow', 'wide', 'sheet', 'sidetabs', 'none']) {
      expect(variants, id).toContain(`id: '${id}'`)
    }
    for (const id of ['inline', 'split', 'index', 'tabs', 'sequence']) {
      expect(variants, id).toContain(`id: '${id}'`)
    }

    /* Fifteen options, each declaring what it gives up. An audition where every
       option claims to be good at everything decides nothing. */
    expect(variants.match(/premise: '/g)?.length).toBe(15)
    expect(variants.match(/cost: '/g)?.length).toBe(15)
  })

  /*
    There is already one place auditions live and one control that reveals it.
    A second entry point in the header would be a second concept for one idea.
  */
  it('lives in the experiment bar, not a control of its own', () => {
    const shell = readFileSync(join(root, 'viewer/app/app/app.vue'), 'utf8')

    expect(shell).toContain('<BusinessLensWorkbenchLabRow />')
    expect(shell).toContain('<BusinessLensThemeLabBar :row-count="2">')
    expect(shell).not.toContain('BusinessLensWorkbenchLabMenu')
  })

  /*
    The variations differ in how they draw an entity, never in what they say
    about it — otherwise the comparison is between two summaries rather than two
    visualizations of one.
  */
  it('draws every option from one description of the entity', () => {
    expect(source('app/components/BlrPageBlock.vue')).toContain("from '../utils/entityFacts'")
    expect(source('app/components/BlrEntityReading.vue')).toContain("from '../utils/pageSections'")
    expect(source('app/components/BlrScenarios.vue')).toContain("from '../utils/pageSections'")
    expect(source('app/utils/entityFacts.ts')).toContain("{ label: 'Type', value: INTERFACE_TYPE_META")
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
