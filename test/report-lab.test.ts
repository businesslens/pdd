import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const LAB = join(__dirname, '..', 'layers', 'nuxt', 'report-lab')

/** The twelve brief-driven designs currently on audition. */
const DESIGNS = [
  ['meridian', 'BlrMeridian'],
  ['inquiry', 'BlrInquiry'],
  ['canvas', 'BlrCanvas'],
  ['tripane', 'BlrTripane'],
  ['workbench', 'BlrWorkbench'],
  ['narrative', 'BlrNarrative'],
  ['promises', 'BlrPromises'],
  ['gateway', 'BlrGateway'],
  ['crossgrid', 'BlrCrossgrid'],
  ['beacon', 'BlrBeacon'],
  ['panorama', 'BlrPanorama'],
  ['orbit', 'BlrOrbit']
] as const

/** Retired experiments must stay deleted, not linger half-registered. */
const RETIRED_COMPONENTS = [
  'Atlas',
  'Dossier',
  'Console',
  'Matrix',
  'Storyboard',
  'Blueprint',
  'Pulse',
  'Codex',
  'Constellation',
  'Ledger',
  'Metro',
  'JourneyStudio',
  'SurfaceMap',
  'CapabilityPortfolio',
  'ActorMissions',
  'RuleObservatory',
  'ContextSwitchboard',
  'ScenarioFlow',
  'CoverageRadar',
  'RelationWorkbench',
  'LensSuite',
  'LensGraph',
  'GraphCanvas',
  'ContextTopology'
]

function source(path: string): string {
  return readFileSync(join(LAB, path), 'utf8')
}

describe('report-lab brief-driven designs', () => {
  it('registers the twelve designs beside the shipped baseline', () => {
    const designs = source('app/utils/reportDesigns.ts')
    const renderer = source('app/components/BusinessLensReportLab.vue')

    expect(designs).toContain("SHIPPED_DESIGN_ID = 'shipped'")
    for (const [id, component] of DESIGNS) {
      expect(designs).toContain(`id: '${id}'`)
      expect(designs).toContain(`component: '${component}'`)
      expect(renderer).toContain(`${component}: defineAsyncComponent`)
      expect(existsSync(join(LAB, 'app', 'components', `${component}.vue`))).toBe(true)
    }
  })

  it('keeps the retired experiments deleted', () => {
    const designs = source('app/utils/reportDesigns.ts')
    const renderer = source('app/components/BusinessLensReportLab.vue')

    for (const name of RETIRED_COMPONENTS) {
      expect(designs).not.toContain(`Blr${name}'`)
      expect(renderer).not.toContain(`Blr${name}:`)
      expect(existsSync(join(LAB, 'app', 'components', `Blr${name}.vue`))).toBe(false)
    }
    for (const util of ['reportGraph', 'reportContextGraph', 'reportPromiseGraph', 'reportLensConcepts']) {
      expect(existsSync(join(LAB, 'app', 'utils', `${util}.ts`))).toBe(false)
    }
  })

  it('shares one Vue Flow foundation across the designs', () => {
    const flow = source('app/utils/flowGraph.ts')
    expect(flow).toContain('export function directRelations')
    expect(flow).toContain('export function buildNeighbourhood')
    expect(flow).toContain('export function layoutFlow')
    expect(flow).toContain('export function buildScreenMap')
    expect(flow).toContain('export function buildSitemapTree')
    expect(flow).toContain('export function buildRadialSitemap')

    const topology = source('app/components/BlrTopology.vue')
    expect(topology).toContain('buildNeighbourhood')
    expect(topology).toContain('neighbourhood')

    const canvas = source('app/components/BlrFlowCanvas.vue')
    expect(canvas).toContain('@vue-flow/core')
    expect(canvas).toContain('#node-blr')
  })

  it('keeps topology contextual: every design draws graphs through the shared surfaces', () => {
    for (const [, component] of DESIGNS) {
      const design = source(`app/components/${component}.vue`)
      const usesSharedFlow = design.includes('BlrTopology') || design.includes('BlrFlowCanvas')
      expect(usesSharedFlow, `${component} should use BlrTopology or BlrFlowCanvas`).toBe(true)
      expect(design.includes('<VueFlow'), `${component} must not mount VueFlow directly`).toBe(false)
    }
  })
})
