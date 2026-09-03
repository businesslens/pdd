import { randomUUID } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { InstallScope, Provider } from './providers.js'
import { providerSkillsDir } from './providers.js'

export const BUSINESSLENS_SKILLS = [
  'businesslens-map',
  'businesslens-ideate',
  'businesslens-verify'
] as const

export type BusinessLensSkill = (typeof BUSINESSLENS_SKILLS)[number]

const MANIFEST_FILE = '.businesslens-install.json'
const LEGACY_SKILLS = [
  // Retired in favor of map, ideate, and the verification-owned resolution
  // loop. Contribution remains a deterministic CLI workflow.
  'businesslens-init',
  'businesslens-sync',
  'businesslens-deep-dive',
  'businesslens-doctor',
  'businesslens-contribute',
  'businesslens-implement',
  'businesslens-validate',
  // Folded into `businesslens-ideate`: deciding what to build and writing that
  // decision into the model are one converging conversation, not two skills.
  'businesslens-plan',
  // Renamed in 0.6.0: the catalog's push action is `publish`, so the skill that
  // proposes a Blueprint by pull request is `contribute`.
  'businesslens-publish',
  'map',
  'sync',
  'deep-dive',
  'publish',
  'analyze-repo',
  'validate-report',
  'submit-report',
  'push-report'
]

export interface InstallationManifest {
  schema: 1
  package: 'businesslens'
  version: string
  provider: string
  scope: InstallScope
  skills: string[]
  installedAt: string
  updatedAt?: string
}

export interface ManagedInstallation {
  provider: Provider
  scope: InstallScope
  skillsDir: string
  manifest: InstallationManifest
}

export interface InstallTarget {
  provider: Provider
  scope: InstallScope
}

export interface InstallResult {
  provider: Provider
  scope: InstallScope
  skillsDir: string
  removedLegacySkills: string[]
  removedLegacyCommands: string[]
}

export function bundledSkillsDir(): string | undefined {
  const here = dirname(fileURLToPath(import.meta.url))
  for (const candidate of [
    join(here, '../skills'),
    join(here, '../../skills'),
    join(here, '../../../skills')
  ]) {
    if (BUSINESSLENS_SKILLS.every(name => existsSync(join(candidate, name, 'SKILL.md')))) {
      return candidate
    }
  }
  return undefined
}

function readManifest(skillsDir: string): InstallationManifest | undefined {
  const file = join(skillsDir, MANIFEST_FILE)
  if (!existsSync(file)) return undefined
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as InstallationManifest
    if (
      parsed.schema === 1
      && parsed.package === 'businesslens'
      && typeof parsed.version === 'string'
      && Array.isArray(parsed.skills)
    ) return parsed
  } catch {
    // Invalid markers never grant overwrite permission.
  }
  return undefined
}

/*
 * Ownership is the manifest, and nothing else. A directory carrying a skill's
 * name without a valid marker is somebody else's — a fork, a hand-written
 * skill, an install by another tool — and the Product leaves it alone. The
 * earlier text heuristic (a SKILL.md that named the skill and mentioned
 * BusinessLens) was a guess, and guessing wrong costs someone work they cannot
 * recover, which is the Rule the model states.
 */
function assertSafeTargets(skillsDir: string, existing: InstallationManifest | undefined, force: boolean): void {
  for (const name of BUSINESSLENS_SKILLS) {
    const target = join(skillsDir, name)
    if (!existsSync(target)) continue
    const owned = existing?.skills.includes(name) ?? false
    if (!owned && !force) {
      throw new Error(
        `Refusing to overwrite ${target}: it is not marked as a BusinessLens-managed skill. Pass --force only if you own that directory.`
      )
    }
  }
}

/**
 * Check every harness target before any is written, so a refusal in the second
 * harness does not leave the first installed. Throws the same error the install
 * itself would.
 */
export function assertInstallTargets(
  cwd: string,
  targets: InstallTarget[],
  options: { force?: boolean, home?: string } = {}
): void {
  for (const target of targets) {
    const skillsDir = providerSkillsDir(target.provider, target.scope, cwd, options.home)
    if (!existsSync(skillsDir)) continue
    assertSafeTargets(skillsDir, readManifest(skillsDir), Boolean(options.force))
  }
}

/* A retired skill is removed only when the manifest says BusinessLens installed
   it. One that is merely named like a retired skill is left alone. */
function removeLegacySkills(skillsDir: string, existing: InstallationManifest | undefined): string[] {
  const removed: string[] = []
  for (const name of LEGACY_SKILLS) {
    const target = join(skillsDir, name)
    if (!existsSync(target) || !existing?.skills.includes(name)) continue
    rmSync(target, { recursive: true, force: true })
    removed.push(name)
  }
  return removed
}

function removeLegacyCommands(cwd: string, target: InstallTarget): string[] {
  if (target.scope !== 'project' || target.provider.id !== 'claude') return []

  const project = resolve(cwd)
  const commandFile = join(project, '.claude', 'commands', 'businesslens', 'init.md')
  if (!existsSync(commandFile)) return []

  try {
    const source = readFileSync(commandFile, 'utf8')
    if (!source.includes('BusinessLens') && !source.includes('.businesslens/')) return []
  } catch {
    return []
  }

  rmSync(commandFile, { force: true })
  const commandDirectory = dirname(commandFile)
  if (readdirSync(commandDirectory).length === 0) {
    rmSync(commandDirectory, { recursive: true })
  }
  return [relative(project, commandFile)]
}

function writeManifest(skillsDir: string, manifest: InstallationManifest): void {
  const file = join(skillsDir, MANIFEST_FILE)
  const temporary = `${file}.${randomUUID()}.tmp`
  writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`)
  renameSync(temporary, file)
}

function installSkill(sourceRoot: string, skillsDir: string, name: BusinessLensSkill): void {
  const source = join(sourceRoot, name)
  const target = join(skillsDir, name)
  const temporary = join(skillsDir, `.${name}.${randomUUID()}.tmp`)
  const backup = join(skillsDir, `.${name}.${randomUUID()}.backup`)
  let movedExisting = false

  try {
    cpSync(source, temporary, { recursive: true })
    if (existsSync(target)) {
      renameSync(target, backup)
      movedExisting = true
    }
    renameSync(temporary, target)
    if (movedExisting) rmSync(backup, { recursive: true, force: true })
  } catch (error) {
    rmSync(temporary, { recursive: true, force: true })
    if (movedExisting && !existsSync(target) && existsSync(backup)) {
      renameSync(backup, target)
    }
    throw error
  }
}

export function installSkillsToTarget(
  cwd: string,
  target: InstallTarget,
  version: string,
  options: { force?: boolean, home?: string } = {}
): InstallResult {
  const sourceRoot = bundledSkillsDir()
  if (!sourceRoot) {
    throw new Error('Bundled BusinessLens skills were not found. Reinstall the businesslens package.')
  }

  const skillsDir = providerSkillsDir(target.provider, target.scope, cwd, options.home)
  mkdirSync(skillsDir, { recursive: true })
  const existing = readManifest(skillsDir)
  assertSafeTargets(skillsDir, existing, Boolean(options.force))

  // A skill the manifest recorded that this version no longer ships is ours to
  // remove; the manifest is the only proof of that.
  const staleSkills = (existing?.skills ?? [])
    .filter(previous => !BUSINESSLENS_SKILLS.includes(previous as BusinessLensSkill))
    .map(previous => join(skillsDir, previous))
    .filter(stale => existsSync(stale))

  for (const name of BUSINESSLENS_SKILLS) installSkill(sourceRoot, skillsDir, name)
  // Retired names first, so the report can say which retired skills went; any
  // other skill the manifest recorded and this version no longer ships follows.
  const removedLegacySkills = removeLegacySkills(skillsDir, existing)
  for (const stale of staleSkills) {
    if (existsSync(stale)) rmSync(stale, { recursive: true, force: true })
  }
  const removedLegacyCommands = removeLegacyCommands(cwd, target)

  const now = new Date().toISOString()
  writeManifest(skillsDir, {
    schema: 1,
    package: 'businesslens',
    version,
    provider: target.provider.id,
    scope: target.scope,
    skills: [...BUSINESSLENS_SKILLS],
    installedAt: existing?.installedAt ?? now,
    updatedAt: now
  })

  return { ...target, skillsDir, removedLegacySkills, removedLegacyCommands }
}

export function findManagedInstallations(
  cwd: string,
  providers: Provider[],
  scopes: InstallScope[],
  home?: string
): ManagedInstallation[] {
  const installations: ManagedInstallation[] = []
  const seen = new Set<string>()
  for (const scope of scopes) {
    for (const provider of providers) {
      const skillsDir = providerSkillsDir(provider, scope, cwd, home)
      if (seen.has(skillsDir)) continue
      seen.add(skillsDir)
      const manifest = readManifest(skillsDir)
      if (manifest) installations.push({ provider, scope, skillsDir, manifest })
    }
  }
  return installations
}

export function installedSkillNames(sourceRoot = bundledSkillsDir()): string[] {
  if (!sourceRoot) return []
  return readdirSync(sourceRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && BUSINESSLENS_SKILLS.includes(entry.name as BusinessLensSkill))
    .map(entry => entry.name)
    .sort()
}
