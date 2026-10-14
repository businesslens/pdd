import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ORCHESTRATED_VERIFY_DESCRIPTION, orchestrationLine } from '../src/core/orchestration.js'

const ROOT = join(__dirname, '..')
const SKILLS = join(ROOT, 'skills')

function skill(name: string): string {
  return readFileSync(join(SKILLS, name, 'SKILL.md'), 'utf8')
}

function normalizedSkill(name: string): string {
  return skill(name).replace(/\s+/g, ' ').trim()
}

// The one sentence that opts a user in to implement with verify. It
// must read the same wherever a user or an agent meets it.
const OPT_IN = 'Implement with pdd-verify: plan the work from `product-model/` in phases and check each part before the next.'

function normalized(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8').replace(/\s+/g, ' ').replace(/\\`/g, '`')
}

function publicSkills(): string[] {
  return readdirSync(SKILLS)
    .filter(name => existsSync(join(SKILLS, name, 'SKILL.md')))
    .sort()
}

describe('public workflow contract', () => {
  it('ships exactly map, ideate, and verify', () => {
    expect(publicSkills()).toEqual([
      'pdd-ideate',
      'pdd-map',
      'pdd-verify'
    ])
  })

  it('keeps map out of recurring verification', () => {
    const source = skill('pdd-map')
    expect(source).toContain('not recurring maintenance')
    expect(source).toContain('recommend `pdd-verify`')
    expect(source).toContain('never run its')
  })

  it('keeps ideation approval-gated and implementation-external', () => {
    const source = skill('pdd-ideate')
    expect(source).toContain('Get explicit approval')
    expect(source).toContain('Do not implement from this skill')
  })

  it('leaves implementing to the user unless they opted in', () => {
    // Ideate cannot know whether the user opted in, so its closing line reads
    // right either way and implementing stays out of it.
    const source = normalizedSkill('pdd-ideate')
    expect(source).toContain('the same however the user works: implement it, then ask to check the code against the model')
    expect(source).toContain('when pdd-kit orchestrates implementation, saying *implement it* is enough')
  })

  it('ships verify with orchestration off, in one line install can switch', () => {
    const source = skill('pdd-verify')
    expect(source.split(orchestrationLine('off')).length).toBe(2)
    expect(source).not.toContain(orchestrationLine('on'))
    expect(normalizedSkill('pdd-verify')).toContain('turned orchestration on when installing pdd-kit (`--orchestrate=on`), which applies to every conversation with this install and is recorded in the line below')
  })

  it('keeps every check request in the orchestrated description', () => {
    const description = skill('pdd-verify').match(/^description: (.*)$/m)![1]!
    // What both descriptions catch, apart from implement requests.
    const checks = description.slice(description.indexOf('Use when the user asks to check'), description.indexOf(' Use to implement'))
    expect(checks.length).toBeGreaterThan(100)
    expect(ORCHESTRATED_VERIFY_DESCRIPTION).toContain(checks)
    expect(ORCHESTRATED_VERIFY_DESCRIPTION).toContain('Use “report only” when no writes or code changes are allowed.')
    expect(ORCHESTRATED_VERIFY_DESCRIPTION).toContain('Use when asked to implement or build any part of the product')
    expect(ORCHESTRATED_VERIFY_DESCRIPTION).toContain('unless the request says to implement without pdd-verify')
    // A plain YAML scalar, short enough for every harness.
    expect(ORCHESTRATED_VERIFY_DESCRIPTION).not.toMatch(/: |#/)
    expect(ORCHESTRATED_VERIFY_DESCRIPTION.length).toBeLessThanOrEqual(1024)
  })

  it('spells the opt-in sentence identically everywhere', () => {
    for (const path of [
      'AGENTS.md',
      'skills/pdd-verify/SKILL.md',
      'src/core/model-readme.ts',
      'docs/skill-pdd-verify.md'
    ]) {
      expect(normalized(path), path).toContain(OPT_IN)
    }
  })

  it('lets a user reach each workflow by asking, not by naming a skill', () => {
    const description = (name: string) => skill(name).match(/^description: (.*)$/m)![1]!
    expect(description('pdd-ideate')).toContain('“make a PDD change”')
    expect(description('pdd-ideate')).toContain('do not use to map established code, implement the model in code')
    expect(description('pdd-verify')).toContain('Use when the user asks to check, verify or audit the code against the Product Model')
    // Implementing is the user's own workflow until they opt in.
    expect(description('pdd-verify')).toContain('Use to implement or build the product only when the user invokes this skill by name for it, or the repository\'s agent instructions or the request say “Implement with pdd-verify”')
    expect(description('pdd-verify')).toContain('otherwise implementing is the user\'s own workflow and this skill does not run')
  })

  it('makes one verify invocation own resolution and reinspection', () => {
    const source = normalizedSkill('pdd-verify')
    expect(source).toContain('must not have to invoke map or ideate manually')
    expect(source).toContain('After every mutation, discard the earlier findings and inspect again')
    expect(source).toContain('The builder is the agent the user asked to implement')
    expect(source).not.toContain('injected')
    expect(source).toContain('same gap returns unchanged')
    expect(source).toContain('Report-only mode forbids writes')
    expect(source).toContain('Persist no receipt')
  })

  it('reports a requested check before fixing only what the user chooses', () => {
    const source = normalizedSkill('pdd-verify')
    expect(source).toContain('otherwise → check mode: report every finding first, then resolve only the ones the user chooses')
    expect(source).toContain('In check mode, report before resolving anything')
    expect(source).toContain('choosing none ends the run with the report')
    expect(source).toContain('in check mode never fix a finding the user did not choose')
  })

  it('implements in phases, when opted in, with the requesting agent as the builder', () => {
    const source = normalizedSkill('pdd-verify')
    expect(source).toContain('a request to implement (or build) from the model, with an opt-in — the user named this skill to do the implementing')
    expect(source).toContain('Your own choice of this skill from its description is not the user naming it, and neither is a request that mentions pdd-verify only to opt out or for a later check')
    expect(source).toContain('and no request to implement without pdd-verify → implement-with-verify mode')
    // Mode comes first, so a request handed back is never stopped for a missing model.
    expect(source.indexOf('1. Parse mode, before anything else')).toBeLessThan(source.indexOf('2. Require an existing Product Model'))
    // A request that reaches verify without an opt-in still gets its code.
    expect(source).toContain('any other request to implement → not this skill\'s work, and the user still asked for code: leave this skill and implement the request the user\'s usual way')
    expect(source).toContain('Without an opt-in, never refuse a request to implement')
    expect(source).toContain('Never enter implement-with-verify mode without an opt-in, nor when the request asks to implement without pdd-verify')
    expect(source).toContain('The model-right findings are the plan')
    expect(source).toContain('slices not yet handed over are the plan, not findings')
    // Three paces, phases by default; checking is per slice at every pace.
    expect(source).toContain('**in phases**, the default')
    expect(source).toContain('**one slice at a time**, when the user asks for it')
    expect(source).toContain('**in one go**, when the user asks for it')
    // The phrasings the docs' pace table promises.
    for (const phrase of ['"slice by slice"', '"all at once"', '"without phases"', '"in a single pass"']) {
      expect(source).toContain(phrase)
    }
    expect(source).toContain('inspect each slice it covered')
    // The plan is a visible checkpoint, and phases hold even on a large model.
    expect(source).toContain('Before writing any code, post the plan as one short list')
    expect(source).toContain('Do this at every pace, including in one go')
    expect(source).toContain('never implement past the current phase')
    expect(source).toContain('Start the next phase only when every slice of this one is aligned or reported blocked')
    expect(source).toContain('never settles a product question in code')
    // The write boundary binds pdd-kit's own phases; implementation, which
    // writes the user's code, must not be forbidden by it.
    expect(source).toContain('Never write outside `product-model/` in an analysis or model-resolution phase')
    expect(source).toContain('Implementation (step 8) writes only the user\'s code')
    expect(source).toContain('stop with the complete handoff packet')

    const rubric = readFileSync(join(SKILLS, 'pdd-verify', 'references', 'verification-rubric.md'), 'utf8')
    expect(rubric).toContain('## Slices and phases')
    expect(rubric).toContain('so two runs agree')
    expect(rubric).toContain('Checking stays per slice at every pace')

    const handoff = readFileSync(join(SKILLS, 'pdd-verify', 'references', 'build-handoff.md'), 'utf8')
    expect(handoff).toContain('do not edit `product-model/`')
    expect(handoff).toContain('never settle a product question in code')
  })

  it('keeps the complete verify classification and routing structure', () => {
    const source = skill('pdd-verify')
    const classifications = source.slice(
      source.indexOf('6. Classify each scoped item:'),
      source.indexOf('Group findings that share one authority decision')
    )
    const routes = source.slice(
      source.indexOf('7. Route each group'),
      source.indexOf('8. A pdd-kit analysis phase')
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

  it('never treats delegated decisions as approval of a model write', () => {
    for (const name of publicSkills()) {
      const source = normalizedSkill(name)
      expect(source, name).toContain('settles those questions; it does not approve the change')
      expect(source, name).toContain('wait for approval before writing')
    }
  })

  it('forbids workflow writes to repository-owned instructions', () => {
    for (const name of publicSkills()) {
      const source = skill(name)
      expect(source, name).toContain('Never write outside `product-model/`')
      expect(source, name).toContain('`AGENTS.md`, `CLAUDE.md`')
    }
  })
})
