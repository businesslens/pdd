import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..')
const SKILLS = join(ROOT, 'skills')

function skill(name: string): string {
  return readFileSync(join(SKILLS, name, 'SKILL.md'), 'utf8')
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
    const source = skill('businesslens-verify')
    expect(source).toContain('must not have to\ninvoke map or ideate manually')
    expect(source).toContain('return directly to step 4')
    expect(source).toContain('injected external builder')
    expect(source).toContain('same gap returns unchanged')
    expect(source).toContain('Report-only mode forbids writes')
    expect(source).toContain('Persist no receipt')
  })

  it('forbids workflow writes to repository-owned instructions', () => {
    for (const name of publicSkills()) {
      const source = skill(name)
      expect(source, name).toContain('Never write outside `.businesslens/`')
      expect(source, name).toContain('`AGENTS.md`, `CLAUDE.md`')
    }
  })
})
