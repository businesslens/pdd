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
    expect(source).toContain('Do not implement from this skill')
  })

  it('hands an approved change to verify\'s build in the user\'s own words', () => {
    const source = normalizedSkill('businesslens-ideate')
    expect(source).toContain('the user can say *build it*')
    expect(source).toContain('builds the change slice by slice in the user\'s own way of working')
  })

  it('lets a user reach each workflow by asking, not by naming a skill', () => {
    const description = (name: string) => skill(name).match(/^description: (.*)$/m)![1]!
    expect(description('businesslens-ideate')).toContain('“make a PDD change”')
    expect(description('businesslens-ideate')).toContain('do not use to map established code, build the model into code')
    expect(description('businesslens-verify')).toContain('Use when asked to build, implement or develop the product')
    expect(description('businesslens-verify')).toContain('“build it” after ideate')
  })

  it('makes one verify invocation own resolution and reinspection', () => {
    const source = normalizedSkill('businesslens-verify')
    expect(source).toContain('must not have to invoke map or ideate manually')
    expect(source).toContain('After every mutation, discard the earlier findings and inspect again')
    expect(source).toContain('The builder is the agent the user asked to build')
    expect(source).not.toContain('injected')
    expect(source).toContain('same gap returns unchanged')
    expect(source).toContain('Report-only mode forbids writes')
    expect(source).toContain('Persist no receipt')
  })

  it('builds slice by slice with the requesting agent as the builder', () => {
    const source = normalizedSkill('businesslens-verify')
    expect(source).toContain('a request to build or implement from the model → build mode')
    expect(source).toContain('In build mode, the model-right findings are the build plan')
    expect(source).toContain('later slices are the plan, not findings')
    expect(source).toContain('never settles a product question in code')
    // The write boundary binds BusinessLens's own phases; the build phase that
    // implements code must not be forbidden by it.
    expect(source).toContain('Never write outside `.businesslens/` in an analysis or model-resolution phase')
    expect(source).toContain('The build phase (step 8) writes only the user\'s code')
    expect(source).toContain('stop with the complete handoff packet')

    const rubric = readFileSync(join(SKILLS, 'businesslens-verify', 'references', 'verification-rubric.md'), 'utf8')
    expect(rubric).toContain('## Build slices')
    expect(rubric).toContain('so two runs agree')

    const handoff = readFileSync(join(SKILLS, 'businesslens-verify', 'references', 'build-handoff.md'), 'utf8')
    expect(handoff).toContain('do not edit `.businesslens/`')
    expect(handoff).toContain('never settle a product question in code')
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
