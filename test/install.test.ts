import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runInstall } from '../src/commands/install.js'
import { runUpdate } from '../src/commands/update.js'
import { providerById } from '../src/core/providers.js'
import { assertInstallTargets } from '../src/core/skill-installation.js'
import {
  BUSINESSLENS_SKILLS,
  installSkillsToTarget
} from '../src/core/skill-installation.js'

const temporaryDirectories: string[] = []

function temporary(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(() => {
  vi.restoreAllMocks()
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('skill installation', () => {
  it('installs only the namespaced skills into every selected project harness', async () => {
    const project = temporary('bl-install-')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    expect(await runInstall(project, {
      providers: 'claude,codex,cursor,gemini,github',
      scope: 'project',
      yes: true
    })).toBe(0)

    for (const root of ['.claude', '.agents', '.cursor', '.gemini', '.github']) {
      const skillsDir = join(project, root, 'skills')
      for (const skill of BUSINESSLENS_SKILLS) {
        expect(existsSync(join(skillsDir, skill, 'SKILL.md'))).toBe(true)
      }
      const manifest = JSON.parse(readFileSync(join(skillsDir, '.businesslens-install.json'), 'utf8'))
      expect(manifest).toMatchObject({
        schema: 1,
        package: 'businesslens',
        scope: 'project',
        skills: [...BUSINESSLENS_SKILLS]
      })
    }

    expect(existsSync(join(project, '.businesslens'))).toBe(false)
    expect(existsSync(join(project, 'AGENTS.md'))).toBe(false)
    expect(existsSync(join(project, '.claude', 'commands'))).toBe(false)
    expect(existsSync(join(project, '.claude', 'skills', 'businesslens-map', 'references', 'format.md'))).toBe(true)
    expect(existsSync(join(project, '.claude', 'skills', 'businesslens-map', 'scripts', 'inventory-repository.mjs'))).toBe(true)
    expect(existsSync(join(project, '.claude', 'skills', 'businesslens-map', 'scripts', 'run-businesslens.mjs'))).toBe(true)
    expect(existsSync(join(project, '.claude', 'skills', 'businesslens-ideate', 'scripts', 'run-businesslens.mjs'))).toBe(true)
    expect(existsSync(join(project, '.claude', 'skills', 'businesslens-verify', 'scripts', 'run-businesslens.mjs'))).toBe(true)
    expect(existsSync(join(project, '.claude', 'skills', 'businesslens-init'))).toBe(false)
    expect(existsSync(join(project, '.claude', 'skills', 'businesslens-sync'))).toBe(false)
    expect(existsSync(join(project, '.claude', 'skills', 'businesslens-contribute'))).toBe(false)
    expect(existsSync(join(project, '.claude', 'skills', 'businesslens-publish'))).toBe(false)
  })

  it('uses provider-specific global destinations', () => {
    const project = temporary('bl-global-project-')
    const home = temporary('bl-global-home-')

    const result = installSkillsToTarget(
      project,
      { provider: providerById('codex'), scope: 'global' },
      '9.9.9',
      { home }
    )

    expect(result.skillsDir).toBe(join(home, '.codex', 'skills'))
    expect(existsSync(join(result.skillsDir, 'businesslens-map', 'SKILL.md'))).toBe(true)
    expect(existsSync(join(project, '.agents'))).toBe(false)
  })

  it('refuses an unowned collision unless force is explicit', () => {
    const project = temporary('bl-collision-')
    const collision = join(project, '.claude', 'skills', 'businesslens-map')
    mkdirSync(collision, { recursive: true })
    writeFileSync(join(collision, 'SKILL.md'), '---\nname: businesslens-map\n---\nUnrelated.\n')

    expect(() => installSkillsToTarget(
      project,
      { provider: providerById('claude'), scope: 'project' },
      '9.9.9'
    )).toThrow(/not marked as a BusinessLens-managed skill/)

    expect(() => installSkillsToTarget(
      project,
      { provider: providerById('claude'), scope: 'project' },
      '9.9.9',
      { force: true }
    )).not.toThrow()
    expect(readFileSync(join(collision, 'SKILL.md'), 'utf8')).toContain('BusinessLens')
  })

  it('refuses an unmarked directory even when its SKILL.md mentions BusinessLens', () => {
    // A fork that kept the skill's name and the word BusinessLens is still
    // somebody else's: only the install manifest proves ownership.
    const project = temporary('bl-fork-')
    const fork = join(project, '.claude', 'skills', 'businesslens-map')
    mkdirSync(fork, { recursive: true })
    writeFileSync(join(fork, 'SKILL.md'), '---\nname: businesslens-map\ndescription: MY OWN FORK of the BusinessLens mapping skill\n---\nMY CUSTOM EDIT.\n')

    expect(() => installSkillsToTarget(
      project,
      { provider: providerById('claude'), scope: 'project' },
      '9.9.9'
    )).toThrow(/not marked as a BusinessLens-managed skill/)
    expect(readFileSync(join(fork, 'SKILL.md'), 'utf8')).toContain('MY CUSTOM EDIT')
  })

  it('checks every harness target before writing any', () => {
    const project = temporary('bl-check-first-')
    const collision = join(project, '.agents', 'skills', 'businesslens-map')
    mkdirSync(collision, { recursive: true })
    writeFileSync(join(collision, 'SKILL.md'), '---\nname: businesslens-map\n---\nUnrelated.\n')

    const targets = [
      { provider: providerById('claude'), scope: 'project' as const },
      { provider: providerById('codex'), scope: 'project' as const }
    ]
    expect(() => assertInstallTargets(project, targets)).toThrow(/not marked as a BusinessLens-managed skill/)
    // The refusal came from the second target, and the first was never written.
    expect(existsSync(join(project, '.claude', 'skills'))).toBe(false)
    expect(() => assertInstallTargets(project, targets, { force: true })).not.toThrow()
  })

  it('removes retired skills only when the manifest says BusinessLens installed them', () => {
    const project = temporary('bl-legacy-')
    const skillsDir = join(project, '.agents', 'skills')
    const oldMap = join(skillsDir, 'map')
    const oldPlan = join(skillsDir, 'businesslens-plan')
    const retiredSync = join(skillsDir, 'businesslens-sync')
    const lookalike = join(skillsDir, 'businesslens-implement')
    const unrelatedSync = join(skillsDir, 'sync')
    for (const directory of [oldMap, oldPlan, retiredSync, lookalike, unrelatedSync]) mkdirSync(directory, { recursive: true })
    writeFileSync(join(oldMap, 'SKILL.md'), '---\nname: map\n---\nBuild a BusinessLens .businesslens/ Product Model.\n')
    writeFileSync(join(oldPlan, 'SKILL.md'), '---\nname: businesslens-plan\n---\nPlan behavior in the .businesslens/ model.\n')
    writeFileSync(join(retiredSync, 'SKILL.md'), '---\nname: businesslens-sync\n---\nReconcile the BusinessLens .businesslens/ model.\n')
    // Named like a retired skill and mentioning BusinessLens, but never recorded
    // by a manifest: it is somebody else's and stays.
    writeFileSync(join(lookalike, 'SKILL.md'), '---\nname: businesslens-implement\n---\nImplement the BusinessLens .businesslens/ model.\n')
    writeFileSync(join(unrelatedSync, 'SKILL.md'), '---\nname: sync\n---\nUnrelated synchronization.\n')
    writeFileSync(join(skillsDir, '.businesslens-install.json'), JSON.stringify({
      schema: 1,
      package: 'businesslens',
      version: '0.5.0',
      provider: 'codex',
      scope: 'project',
      skills: ['map', 'businesslens-plan', 'businesslens-sync'],
      installedAt: '2026-01-01T00:00:00.000Z'
    }))

    const result = installSkillsToTarget(
      project,
      { provider: providerById('codex'), scope: 'project' },
      '9.9.9'
    )

    // `plan` folded into `ideate`, so an installed copy is a skill an agent
    // could still invoke and must go — because the manifest says it was ours.
    expect(result.removedLegacySkills).toEqual([
      'businesslens-sync',
      'businesslens-plan',
      'map'
    ])
    expect(existsSync(oldMap)).toBe(false)
    expect(existsSync(oldPlan)).toBe(false)
    expect(existsSync(retiredSync)).toBe(false)
    expect(existsSync(lookalike)).toBe(true)
    expect(existsSync(unrelatedSync)).toBe(true)

    const oldCommand = join(project, '.claude', 'commands', 'businesslens', 'init.md')
    mkdirSync(join(project, '.claude', 'skills'), { recursive: true })
    mkdirSync(join(project, '.claude', 'commands', 'businesslens'), { recursive: true })
    writeFileSync(oldCommand, '# Initialize BusinessLens\n\nCreate `.businesslens/`.\n')
    const claudeResult = installSkillsToTarget(
      project,
      { provider: providerById('claude'), scope: 'project' },
      '9.9.9'
    )
    expect(claudeResult.removedLegacyCommands).toEqual([
      join('.claude', 'commands', 'businesslens', 'init.md')
    ])
    expect(existsSync(oldCommand)).toBe(false)
  })

  it('updates managed skills without changing product files', async () => {
    const project = temporary('bl-update-')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    installSkillsToTarget(
      project,
      { provider: providerById('claude'), scope: 'project' },
      '0.0.1'
    )
    const skillsDir = join(project, '.claude', 'skills')
    const manifestFile = join(skillsDir, '.businesslens-install.json')
    const originalManifest = JSON.parse(
      readFileSync(manifestFile, 'utf8')
    )
    originalManifest.skills = originalManifest.skills.filter(
      (skill: string) => skill !== 'businesslens-verify'
    )
    writeFileSync(manifestFile, `${JSON.stringify(originalManifest, null, 2)}\n`)
    rmSync(join(skillsDir, 'businesslens-verify'), { recursive: true })
    const product = join(project, '.businesslens', 'product.md')
    mkdirSync(join(project, '.businesslens'), { recursive: true })
    writeFileSync(product, '# Keep me\n')

    expect(await runUpdate(project, { project: true })).toBe(0)
    expect(readFileSync(product, 'utf8')).toBe('# Keep me\n')
    expect(existsSync(join(skillsDir, 'businesslens-verify', 'SKILL.md'))).toBe(true)
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
    expect(manifest.version).not.toBe('0.0.1')
    expect(manifest.installedAt).toBe(originalManifest.installedAt)
    expect(manifest.updatedAt).toBeDefined()
    expect(manifest.skills).toEqual([...BUSINESSLENS_SKILLS])
  })
})
