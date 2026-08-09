import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { lintModel } from '../src/commands/lint.js'
import { loadModel } from '../src/core/model.js'

const BLUEPRINT = join(__dirname, '..', 'blueprints', 'content-feed-reader')

describe('Content Feed Reader teaching Blueprint', () => {
  it('stays simple, valid, and demonstrates every entity more than once', () => {
    const result = lintModel(loadModel(BLUEPRINT), [])

    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.counts).toEqual({
      actors: 2,
      interfaces: 2,
      experiences: 2,
      screens: 4,
      domains: 2,
      capabilities: 5,
      capabilityScenarios: 10,
      journeys: 3,
      journeyScenarios: 6,
      businessRules: 4
    })
    expect(Object.values(result.counts).every(count => count >= 2)).toBe(true)
  })
})
