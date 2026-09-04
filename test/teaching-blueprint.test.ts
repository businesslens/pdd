import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { lintModel } from '../src/commands/lint.js'
import { loadModel } from '../src/core/model.js'

const BLUEPRINT = join(__dirname, '..', 'blueprints', 'content-feed-reader')

describe('Content Feed Reader teaching Blueprint', () => {
  it('stays valid and demonstrates every resource more than once', () => {
    const result = lintModel(loadModel(BLUEPRINT), [])

    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.counts).toEqual({
      interfaces: 2,
      experiences: 3,
      screens: 9,
      domains: 3,
      entities: 5,
      capabilities: 10,
      capabilityScenarios: 30,
      journeys: 4,
      journeyScenarios: 8,
      businessRules: 5
    })
    expect(Object.values(result.counts).every(count => count >= 2)).toBe(true)
  })

  /*
    Both terminal results and a failure-only Capability have to appear
    somewhere, or the Blueprint teaches that `result` is decoration and no
    consumer ever renders `failureOnlyCapabilityIds` against real data.
  */
  it('demonstrates both Journey Scenario results and a failure-only Capability', () => {
    const model = loadModel(BLUEPRINT)
    const results = new Set(model.journeyScenarios.map(scenario => scenario.result))

    expect(results).toEqual(new Set(['achieved', 'not-achieved']))

    const catchUp = model.journeyScenarios.filter(scenario => scenario.journey === 'catch-up-on-unread')
    const achieved = new Set(catchUp
      .filter(scenario => scenario.result === 'achieved')
      .flatMap(scenario => scenario.steps.flatMap(item => item.capability ? [item.capability] : [])))
    const failureOnly = new Set(catchUp
      .filter(scenario => scenario.result === 'not-achieved')
      .flatMap(scenario => scenario.steps.flatMap(item => item.capability ? [item.capability] : []))
      .filter(capability => !achieved.has(capability)))

    expect([...failureOnly]).toEqual(['synchronize-feeds'])
  })
})
