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
import { assertInstallTargets, findUnmanagedInstallations } from '../src/core/skill-installation.js'
import {
  PDD_KIT_SKILLS,
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
  vi.unstubAllEnvs()
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('skill installation', () => {
  it('installs only the namespaced skills into every selected project harness', async () => {
    const project = temporary('pdd-kit-install-')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    expect(await runInstall(project, {
      providers: 'claude,codex,cursor,gemini,github',
      scope: 'project',
      yes: true
    })).toBe(0)

    for (const root of ['.claude', '.agents', '.cursor', '.gemini', '.github']) {
      const skillsDir = join(project, root, 'skills')
      for (const skill of PDD_KIT_SKILLS) {
        expect(existsSync(join(skillsDir, skill, 'SKILL.md'))).toBe(true)
      }
      const manifest = JSON.parse(readFileSync(join(skillsDir, '.pdd-kit-install.json'), 'utf8'))
      expect(manifest).toMatchObject({
        schema: 1,
        package: 'pdd-toolkit',
        scope: 'project',
        skills: [...PDD_KIT_SKILLS]
      })
    }

    expect(existsSync(join(project, 'product-model'))).toBe(false)
    expect(existsSync(join(project, 'AGENTS.md'))).toBe(false)
    expect(existsSync(join(project, '.claude', 'commands'))).toBe(false)
    expect(existsSync(join(project, '.claude', 'skills', 'pdd-map', 'references', 'format.md'))).toBe(true)
    expect(existsSync(join(project, '.claude', 'skills', 'pdd-map', 'scripts', 'inventory-repository.mjs'))).toBe(true)
    expect(existsSync(join(project, '.claude', 'skills', 'pdd-map', 'scripts', 'run-pdd-kit.mjs'))).toBe(true)
    expect(existsSync(join(project, '.claude', 'skills', 'pdd-ideate', 'scripts', 'run-pdd-kit.mjs'))).toBe(true)
    expect(existsSync(join(project, '.claude', 'skills', 'pdd-verify', 'scripts', 'run-pdd-kit.mjs'))).toBe(true)
    expect(existsSync(join(project, '.claude', 'skills', 'pdd-kit-init'))).toBe(false)
    expect(existsSync(join(project, '.claude', 'skills', 'pdd-kit-sync'))).toBe(false)
    expect(existsSync(join(project, '.claude', 'skills', 'pdd-kit-contribute'))).toBe(false)
    expect(existsSync(join(project, '.claude', 'skills', 'pdd-kit-publish'))).toBe(false)
  })

  it('uses provider-specific global destinations', () => {
    // Exercise the default location without inheriting a real harness home.
    vi.stubEnv('CODEX_HOME', undefined)
    const project = temporary('pdd-kit-global-project-')
    const home = temporary('pdd-kit-global-home-')

    const result = installSkillsToTarget(
      project,
      { provider: providerById('codex'), scope: 'global' },
      '9.9.9',
      { home }
    )

    // Codex reads user skills from ~/.agents/skills, not $CODEX_HOME/skills.
    expect(result.skillsDir).toBe(join(home, '.agents', 'skills'))
    expect(existsSync(join(result.skillsDir, 'pdd-map', 'SKILL.md'))).toBe(true)
    expect(existsSync(join(home, '.codex', 'skills'))).toBe(false)
    expect(existsSync(join(project, '.agents'))).toBe(false)
  })

  it('refuses an unowned collision unless force is explicit', () => {
    const project = temporary('pdd-kit-collision-')
    const collision = join(project, '.claude', 'skills', 'pdd-map')
    mkdirSync(collision, { recursive: true })
    writeFileSync(join(collision, 'SKILL.md'), '---\nname: pdd-map\n---\nUnrelated.\n')

    expect(() => installSkillsToTarget(
      project,
      { provider: providerById('claude'), scope: 'project' },
      '9.9.9'
    )).toThrow(/not marked as a pdd-kit-managed skill/)

    expect(() => installSkillsToTarget(
      project,
      { provider: providerById('claude'), scope: 'project' },
      '9.9.9',
      { force: true }
    )).not.toThrow()
    expect(readFileSync(join(collision, 'SKILL.md'), 'utf8')).toContain('pdd-kit')
  })

  it('refuses an unmarked directory even when its SKILL.md mentions pdd-kit', () => {
    // A fork that kept the skill's name and the word pdd-kit is still
    // somebody else's: only the install manifest proves ownership.
    const project = temporary('pdd-kit-fork-')
    const fork = join(project, '.claude', 'skills', 'pdd-map')
    mkdirSync(fork, { recursive: true })
    writeFileSync(join(fork, 'SKILL.md'), '---\nname: pdd-map\ndescription: MY OWN FORK of the pdd-kit mapping skill\n---\nMY CUSTOM EDIT.\n')

    expect(() => installSkillsToTarget(
      project,
      { provider: providerById('claude'), scope: 'project' },
      '9.9.9'
    )).toThrow(/not marked as a pdd-kit-managed skill/)
    expect(readFileSync(join(fork, 'SKILL.md'), 'utf8')).toContain('MY CUSTOM EDIT')
  })

  it('refuses a manifest that records a name outside the skills directory', () => {
    // The manifest is read out of the target repository, which is untrusted. A
    // recorded name reaches a recursive remove, so a name that escapes the
    // skills directory invalidates the marker instead of being followed.
    const project = temporary('pdd-kit-hostile-manifest-')
    const skillsDir = join(project, '.agents', 'skills')
    const victim = join(project, 'victim')
    const claimed = join(skillsDir, 'pdd-map')
    mkdirSync(victim, { recursive: true })
    mkdirSync(claimed, { recursive: true })
    writeFileSync(join(victim, 'secret.txt'), 'not pdd-kit property\n')
    writeFileSync(join(claimed, 'SKILL.md'), '---\nname: pdd-map\n---\nSomebody else.\n')
    writeFileSync(join(skillsDir, '.pdd-kit-install.json'), JSON.stringify({
      schema: 1,
      package: 'pdd-toolkit',
      version: '0.5.0',
      provider: 'codex',
      scope: 'project',
      skills: ['pdd-map', '../../victim'],
      installedAt: '2026-01-01T00:00:00.000Z'
    }))

    // The marker is not ours, so it grants no ownership either.
    expect(() => installSkillsToTarget(
      project,
      { provider: providerById('codex'), scope: 'project' },
      '9.9.9'
    )).toThrow(/not marked as a pdd-kit-managed skill/)
    expect(existsSync(join(victim, 'secret.txt'))).toBe(true)

    // Not even `--force`, which grants overwriting this skills directory and
    // nothing above it.
    installSkillsToTarget(
      project,
      { provider: providerById('codex'), scope: 'project' },
      '9.9.9',
      { force: true }
    )
    expect(existsSync(join(victim, 'secret.txt'))).toBe(true)
  })

  it('leaves a recorded name this Product could never have written', () => {
    // A well-formed marker still only proves ownership of names pdd-kit
    // ships or once shipped; anything else in the list is somebody's own work.
    const project = temporary('pdd-kit-stale-name-')
    const skillsDir = join(project, '.agents', 'skills')
    const notOurs = join(skillsDir, 'my-notes')
    mkdirSync(notOurs, { recursive: true })
    writeFileSync(join(notOurs, 'SKILL.md'), '---\nname: my-notes\n---\nMine.\n')
    writeFileSync(join(skillsDir, '.pdd-kit-install.json'), JSON.stringify({
      schema: 1,
      package: 'pdd-toolkit',
      version: '0.5.0',
      provider: 'codex',
      scope: 'project',
      skills: [...PDD_KIT_SKILLS, 'my-notes'],
      installedAt: '2026-01-01T00:00:00.000Z'
    }))

    installSkillsToTarget(
      project,
      { provider: providerById('codex'), scope: 'project' },
      '9.9.9'
    )
    expect(existsSync(join(notOurs, 'SKILL.md'))).toBe(true)
  })

  it('checks every harness target before writing any', () => {
    const project = temporary('pdd-kit-check-first-')
    const collision = join(project, '.agents', 'skills', 'pdd-map')
    mkdirSync(collision, { recursive: true })
    writeFileSync(join(collision, 'SKILL.md'), '---\nname: pdd-map\n---\nUnrelated.\n')

    const targets = [
      { provider: providerById('claude'), scope: 'project' as const },
      { provider: providerById('codex'), scope: 'project' as const }
    ]
    expect(() => assertInstallTargets(project, targets)).toThrow(/not marked as a pdd-kit-managed skill/)
    // The refusal came from the second target, and the first was never written.
    expect(existsSync(join(project, '.claude', 'skills'))).toBe(false)
    expect(() => assertInstallTargets(project, targets, { force: true })).not.toThrow()
  })

  it('removes stale owned namespaced skills and leaves unowned files alone', () => {
    const project = temporary('pdd-kit-owned-skills-')
    const skillsDir = join(project, '.agents', 'skills')
    const stale = join(skillsDir, 'pdd-kit-example')
    const lookalike = join(skillsDir, 'pdd-kit-unowned')
    const unrelated = join(skillsDir, 'map')
    for (const directory of [stale, lookalike, unrelated]) {
      mkdirSync(directory, { recursive: true })
      writeFileSync(join(directory, 'SKILL.md'), '# Example pdd-kit skill')
    }
    writeFileSync(join(skillsDir, '.pdd-kit-install.json'), JSON.stringify({
      schema: 1,
      package: 'pdd-toolkit',
      version: '0.12.0',
      provider: 'codex',
      scope: 'project',
      skills: ['pdd-kit-example', 'map'],
      installedAt: '2026-01-01T00:00:00.000Z'
    }))

    installSkillsToTarget(project, { provider: providerById('codex'), scope: 'project' }, '9.9.9')
    expect(existsSync(stale)).toBe(false)
    expect(existsSync(lookalike)).toBe(true)
    expect(existsSync(unrelated)).toBe(true)

    const command = join(project, '.claude', 'commands', 'pdd-kit', 'init.md')
    mkdirSync(join(project, '.claude', 'commands', 'pdd-kit'), { recursive: true })
    writeFileSync(command, '# pdd-kit command owned by another tool')
    installSkillsToTarget(project, { provider: providerById('claude'), scope: 'project' }, '9.9.9')
    expect(existsSync(command)).toBe(true)
  })

  it('updates managed skills without changing product files', async () => {
    const project = temporary('pdd-kit-update-')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    installSkillsToTarget(
      project,
      { provider: providerById('claude'), scope: 'project' },
      '0.0.1'
    )
    const skillsDir = join(project, '.claude', 'skills')
    const manifestFile = join(skillsDir, '.pdd-kit-install.json')
    const originalManifest = JSON.parse(
      readFileSync(manifestFile, 'utf8')
    )
    originalManifest.skills = originalManifest.skills.filter(
      (skill: string) => skill !== 'pdd-verify'
    )
    writeFileSync(manifestFile, `${JSON.stringify(originalManifest, null, 2)}\n`)
    rmSync(join(skillsDir, 'pdd-verify'), { recursive: true })
    const product = join(project, 'product-model', 'product.md')
    mkdirSync(join(project, 'product-model'), { recursive: true })
    writeFileSync(product, '# Keep me\n')

    expect(await runUpdate(project, { scope: 'project' })).toBe(0)
    expect(readFileSync(product, 'utf8')).toBe('# Keep me\n')
    expect(existsSync(join(skillsDir, 'pdd-verify', 'SKILL.md'))).toBe(true)
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
    expect(manifest.version).not.toBe('0.0.1')
    expect(manifest.installedAt).toBe(originalManifest.installedAt)
    expect(manifest.updatedAt).toBeDefined()
    expect(manifest.skills).toEqual([...PDD_KIT_SKILLS])
  })
})

describe('installations this version does not manage', () => {
  function plantInstallation(skillsDir: string, marker: string): void {
    for (const skill of PDD_KIT_SKILLS) {
      mkdirSync(join(skillsDir, skill), { recursive: true })
      writeFileSync(join(skillsDir, skill, 'SKILL.md'), `---\nname: ${skill}\n---\nOld.\n`)
    }
    writeFileSync(join(skillsDir, '.pdd-kit-install.json'), marker)
  }

  function otherPackageMarker(packageName: string): string {
    return JSON.stringify({
      schema: 1,
      package: packageName,
      version: '0.34.0',
      provider: 'claude',
      scope: 'project',
      skills: [...PDD_KIT_SKILLS],
      installedAt: '2026-01-01T00:00:00.000Z'
    })
  }

  it('names the other package and the one command that replaces its install', async () => {
    const project = temporary('pdd-kit-previous-package-')
    const skillsDir = join(project, '.claude', 'skills')
    plantInstallation(skillsDir, otherPackageMarker('another-skills-package'))
    const errors: string[] = []
    vi.spyOn(console, 'error').mockImplementation(message => { errors.push(String(message)) })
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    expect(await runUpdate(project, { scope: 'project' })).toBe(1)
    expect(errors.join('\n')).toContain('installed by another package, another-skills-package,')
    expect(errors.join('\n')).toContain('`pdd-kit install --providers claude --scope project --force` once')
    expect(errors.join('\n')).not.toContain('Run `pdd-kit install` first')

    expect(() => installSkillsToTarget(
      project,
      { provider: providerById('claude'), scope: 'project' },
      '9.9.9'
    )).toThrow(/installed by another package, another-skills-package,.*`pdd-kit install --providers claude --scope project --force` once/)
    // Nothing migrates on its own: the old skills are untouched until --force.
    expect(readFileSync(join(skillsDir, 'pdd-map', 'SKILL.md'), 'utf8')).toContain('Old.')

    expect(await runInstall(project, { providers: 'claude', scope: 'project', yes: true, force: true })).toBe(0)
    expect(JSON.parse(readFileSync(join(skillsDir, '.pdd-kit-install.json'), 'utf8')).package).toBe('pdd-toolkit')
    expect(await runUpdate(project, { scope: 'project' })).toBe(0)
  })

  it('reports a marker that is not valid JSON by its file, not as a missing installation', async () => {
    const project = temporary('pdd-kit-corrupt-marker-')
    const skillsDir = join(project, '.claude', 'skills')
    const marker = join(skillsDir, '.pdd-kit-install.json')
    plantInstallation(skillsDir, '{ "schema": 1,')
    const errors: string[] = []
    vi.spyOn(console, 'error').mockImplementation(message => { errors.push(String(message)) })

    expect(await runUpdate(project, { scope: 'project' })).toBe(1)
    expect(errors.join('\n')).toContain(`${marker} is not valid JSON`)
    expect(errors.join('\n')).toContain('`pdd-kit install --providers claude --scope project --force`')

    expect(() => installSkillsToTarget(
      project,
      { provider: providerById('claude'), scope: 'project' },
      '9.9.9'
    )).toThrow(`its marker ${marker} is not valid JSON`)
  })

  it('still says nothing is installed when there is nothing to name', async () => {
    const project = temporary('pdd-kit-nothing-')
    const errors: string[] = []
    vi.spyOn(console, 'error').mockImplementation(message => { errors.push(String(message)) })

    expect(await runUpdate(project, { scope: 'project' })).toBe(1)
    expect(errors).toEqual(['No managed pdd-kit skill installation found. Run `pdd-kit install` first.'])
  })

  it('names a Codex global install left at the location Codex no longer reads', () => {
    vi.stubEnv('CODEX_HOME', undefined)
    const project = temporary('pdd-kit-retired-codex-project-')
    const home = temporary('pdd-kit-retired-codex-home-')
    const retired = join(home, '.codex', 'skills')
    plantInstallation(retired, JSON.stringify({
      schema: 1,
      package: 'pdd-toolkit',
      version: '0.35.0',
      provider: 'codex',
      scope: 'global',
      skills: [...PDD_KIT_SKILLS],
      installedAt: '2026-01-01T00:00:00.000Z'
    }))

    const found = findUnmanagedInstallations(project, [providerById('codex')], ['global'], path => path, home)
    expect(found).toHaveLength(1)
    expect(found[0]!.skillsDir).toBe(retired)
    expect(found[0]!.message).toContain(`it now reads ${join(home, '.agents', 'skills')}`)
    expect(found[0]!.message).toContain('`pdd-kit install --providers codex --scope global`')
    expect(found[0]!.message).toContain('delete pdd-map, pdd-ideate, pdd-verify, .pdd-kit-install.json')
    expect(existsSync(join(retired, 'pdd-map', 'SKILL.md'))).toBe(true)
  })
})
