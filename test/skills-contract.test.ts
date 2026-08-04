import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..')
const SKILLS = join(ROOT, 'skills')

function skill(name: string): string {
  return readFileSync(join(SKILLS, name, 'SKILL.md'), 'utf8')
}

function normalizedSkill(name: string): string {
  return skill(name).replace(/\s+/g, ' ').trim()
}

function publicSkills(): string[] {
  return readdirSync(SKILLS)
    .filter(name => existsSync(join(SKILLS, name, 'SKILL.md')))
    .sort()
}

describe('public workflow contract', () => {
  it('ships exactly map, ideate, and verify', () => {
    expect(publicSkills()).toEqual([
      'businesslens-ideate',
      'businesslens-map',
      'businesslens-verify'
    ])
  })

  it('keeps map out of recurring verification', () => {
    const source = skill('businesslens-map')
    expect(source).toContain('not recurring maintenance')
    expect(source).toContain('recommend `businesslens-verify`')
    expect(source).toContain('never run its')
  })

  it('keeps ideation approval-gated and implementation-external', () => {
    const source = skill('businesslens-ideate')
    expect(source).toContain('Get explicit approval')
    expect(source).toContain('injected build flow')
    expect(source).toContain('Do not implement from this skill')
  })

  it('makes one verify invocation own resolution and reinspection', () => {
    const source = normalizedSkill('businesslens-verify')
    expect(source).toContain('must not have to invoke map or ideate manually')
    expect(source).toContain('After every mutation, discard the earlier findings and inspect again')
    expect(source).toContain('injected external builder')
    expect(source).toContain('same gap returns unchanged')
    expect(source).toContain('Report-only mode forbids writes')
    expect(source).toContain('Persist no receipt')
  })

  it('keeps the complete verify classification and routing structure', () => {
    const source = skill('businesslens-verify')
    const classifications = source.slice(
      source.indexOf('6. Classify each scoped item:'),
      source.indexOf('Group findings that share one authority decision')
    )
    const routes = source.slice(
      source.indexOf('7. Route each group'),
      source.indexOf('8. A BusinessLens analysis phase')
    )

    expect([...classifications.matchAll(/^\s*- \*\*([a-z-]+)\*\* —/gm)].map(match => match[1])).toEqual([
      'aligned',
      'model-right',
      'code-right',
      'neither-right',
      'unmapped',
      'unverifiable'
    ])
    expect([...routes.matchAll(/^\s*\*\*([A-Z][A-Za-z-]+)\*\*$/gm)].map(match => match[1])).toEqual([
      'Model-right',
      'Code-right',
      'Neither-right',
      'Unmapped',
      'Unverifiable'
    ])
  })

  it('forbids workflow writes to repository-owned instructions', () => {
    for (const name of publicSkills()) {
      const source = skill(name)
      expect(source, name).toContain('Never write outside `.businesslens/`')
      expect(source, name).toContain('`AGENTS.md`, `CLAUDE.md`')
    }
  })
})
