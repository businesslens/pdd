import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { loadModel } from '../src/core/model.js'
import { formatReportCategory, projectReportView } from '../src/report-view-model.js'

const MODEL_ROOT = join(
  fileURLToPath(new URL('.', import.meta.url)),
  'fixtures',
  'fixture-shop'
)

describe('shared Product Report projection', () => {
  it('projects stable report content without catalog metadata', () => {
    const source = compileReport(loadModel(MODEL_ROOT), '2026-01-01')
    const report = projectReportView(source)

    expect(report).toMatchObject({
      id: 'fixture-shop',
      title: source.title,
      summary: source.summary,
      description: source.description,
      category: 'Commerce',
      authors: source.authors,
      license: 'MIT',
      intent: source.intent,
      limitations: source.limitations
    })
    expect(report.stats).toEqual([
      { key: 'actors', label: 'Actors', value: source.counts.actors },
      { key: 'capabilities', label: 'Capabilities', value: source.counts.capabilities },
      { key: 'journeys', label: 'Journeys', value: source.counts.journeys },
      { key: 'scenarios', label: 'Scenarios', value: source.counts.scenarios },
      { key: 'rules', label: 'Rules', value: source.counts.businessRules }
    ])
    expect(report.actors.map(actor => actor.id)).toEqual(
      source.model.actors.map(actor => actor.id)
    )
    expect(report.capabilities.map(capability => capability.id)).toEqual(
      source.model.capabilities.map(capability => capability.id)
    )
    expect(report.journeys.map(journey => journey.id)).toEqual(
      source.model.journeys.map(journey => journey.id)
    )
    expect(report.rules.map(rule => rule.id)).toEqual(
      source.model.businessRules.map(rule => rule.id)
    )
    expect(report.scenarios.map(scenario => scenario.id)).toEqual(
      source.model.scenarios.map(scenario => scenario.id)
    )
    expect(report).not.toHaveProperty('slug')
    expect(report).not.toHaveProperty('source')
  })

  it('formats categories for people without title-casing every word', () => {
    expect(formatReportCategory('content-and-feeds')).toBe('Content and feeds')
  })

  it('does not mutate the Product Report', () => {
    const source = compileReport(loadModel(MODEL_ROOT), '2026-01-01')
    const before = structuredClone(source)

    projectReportView(source)

    expect(source).toEqual(before)
  })
})
