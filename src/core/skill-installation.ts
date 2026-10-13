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
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { InstallScope, Provider } from './providers.js'
import { providerSkillsDir } from './providers.js'
import { PACKAGE_NAME } from '../version.js'
import { cliCommand } from './invocation.js'

export const PDD_KIT_SKILLS = [
  'pdd-map',
  'pdd-ideate',
  'pdd-verify'
] as const

export type PddKitSkill = (typeof PDD_KIT_SKILLS)[number]

const MANIFEST_FILE = '.pdd-kit-install.json'
export interface InstallationManifest {
  schema: 1
  package: typeof PACKAGE_NAME
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
}

export function bundledSkillsDir(): string | undefined {
  const here = dirname(fileURLToPath(import.meta.url))
  for (const candidate of [
    join(here, '../skills'),
    join(here, '../../skills'),
    join(here, '../../../skills')
  ]) {
    if (PDD_KIT_SKILLS.every(name => existsSync(join(candidate, name, 'SKILL.md')))) {
      return candidate
    }
  }
  return undefined
}

/*
 * A manifest is read out of the repository being installed into, and a target
 * repository is untrusted. Every name it records reaches `join` and a recursive
 * remove, so a name that is not a plain directory — `..`, a separator, an
 * absolute path — is not a skill this Product ever wrote, and the marker
 * carrying it is not ours.
 */
const SKILL_DIRECTORY_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isSkillDirectoryName(name: unknown): name is string {
  return typeof name === 'string' && SKILL_DIRECTORY_NAME.test(name)
}

/* Belt and braces beside the name check: a path handed to a removal must still
   resolve to a direct child of the skills directory. */
function ownedChildPath(skillsDir: string, name: string): string | undefined {
  if (!isSkillDirectoryName(name)) return undefined
  const target = resolve(skillsDir, name)
  if (dirname(target) !== resolve(skillsDir)) return undefined
  return target
}

/** What a skills directory's pdd-kit marker says about who installed it. */
export type SkillsDirMarker =
  | { kind: 'none' }
  | { kind: 'managed', manifest: InstallationManifest }
  /**
   * Well formed, but written by another package. Named so the reader knows; it
   * grants no ownership, and a reinstall over it takes an explicit `--force`.
   */
  | { kind: 'other-package', file: string, packageName: string, skills: string[] }
  /** Present, but not JSON, or not a shape any pdd-kit release wrote. */
  | { kind: 'invalid', file: string, reason: 'not valid JSON' | 'not a pdd-kit installation marker' }

function isMarkerShape(parsed: unknown): parsed is InstallationManifest {
  const candidate = parsed as Partial<InstallationManifest> | null
  return Boolean(candidate)
    && typeof candidate === 'object'
    && candidate!.schema === 1
    && typeof candidate!.version === 'string'
    && Array.isArray(candidate!.skills)
    && candidate!.skills.every(isSkillDirectoryName)
}

export function inspectSkillsDir(skillsDir: string): SkillsDirMarker {
  const file = join(skillsDir, MANIFEST_FILE)
  if (!existsSync(file)) return { kind: 'none' }
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    // Invalid markers never grant overwrite permission.
    return { kind: 'invalid', file, reason: 'not valid JSON' }
  }
  if (isMarkerShape(parsed)) {
    const packageName: unknown = parsed.package
    if (packageName === PACKAGE_NAME) return { kind: 'managed', manifest: parsed }
    if (typeof packageName === 'string' && /^(?:@[a-z0-9._~-]+\/)?[a-z0-9._~-]+$/.test(packageName)) {
      return { kind: 'other-package', file, packageName, skills: parsed.skills }
    }
  }
  return { kind: 'invalid', file, reason: 'not a pdd-kit installation marker' }
}

function readManifest(skillsDir: string): InstallationManifest | undefined {
  const marker = inspectSkillsDir(skillsDir)
  return marker.kind === 'managed' ? marker.manifest : undefined
}

/** The command that reinstalls one harness and scope, for a hint. */
function reinstallCommand(target: InstallTarget, force: boolean): string {
  return cliCommand(`install --providers ${target.provider.id} --scope ${target.scope}${force ? ' --force' : ''}`)
}

/*
 * Ownership is the manifest, and nothing else. A directory carrying a skill's
 * name without a valid marker is somebody else's — a fork, a hand-written
 * skill, an install by another tool — and the Product leaves it alone. The
 * earlier text heuristic (a SKILL.md that named the skill and mentioned
 * pdd-kit) was a guess, and guessing wrong costs someone work they cannot
 * recover, which is the Rule the model states.
 */
function assertSafeTargets(skillsDir: string, marker: SkillsDirMarker, target: InstallTarget, force: boolean): void {
  if (force) return
  const existing = marker.kind === 'managed' ? marker.manifest : undefined
  for (const name of PDD_KIT_SKILLS) {
    const directory = join(skillsDir, name)
    if (!existsSync(directory)) continue
    if (existing?.skills.includes(name)) continue
    if (marker.kind === 'other-package') {
      throw new Error(
        `Refusing to overwrite ${directory}: it was installed by another package, ${marker.packageName}, which this version does not manage. `
        + `Run \`${reinstallCommand(target, true)}\` once to replace it.`
      )
    }
    if (marker.kind === 'invalid') {
      throw new Error(
        `Refusing to overwrite ${directory}: its marker ${marker.file} is ${marker.reason}, so it is not marked as a pdd-kit-managed skill. `
        + 'Pass --force only if you own that directory.'
      )
    }
    throw new Error(
      `Refusing to overwrite ${directory}: it is not marked as a pdd-kit-managed skill. Pass --force only if you own that directory.`
    )
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
    assertSafeTargets(skillsDir, inspectSkillsDir(skillsDir), target, Boolean(options.force))
  }
}

function writeManifest(skillsDir: string, manifest: InstallationManifest): void {
  const file = join(skillsDir, MANIFEST_FILE)
  const temporary = `${file}.${randomUUID()}.tmp`
  writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`)
  renameSync(temporary, file)
}

function installSkill(sourceRoot: string, skillsDir: string, name: PddKitSkill): void {
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
    throw new Error('Bundled pdd-kit skills were not found. Reinstall the pdd-kit package.')
  }

  const skillsDir = providerSkillsDir(target.provider, target.scope, cwd, options.home)
  mkdirSync(skillsDir, { recursive: true })
  const marker = inspectSkillsDir(skillsDir)
  assertSafeTargets(skillsDir, marker, target, Boolean(options.force))
  const existing = marker.kind === 'managed' ? marker.manifest : undefined

  // A skill the manifest recorded that this version no longer ships is ours to
  // remove; the manifest is the only proof of that. The proof extends to the
  // name it records and no further: a name this Product could not have written,
  // or one that does not resolve inside the skills directory, is removed by
  // nobody.
  const staleSkills = (existing?.skills ?? [])
    .filter(previous => !PDD_KIT_SKILLS.includes(previous as PddKitSkill))
    .filter(name => name.startsWith('pdd-'))
    .map(previous => ownedChildPath(skillsDir, previous))
    .filter((stale): stale is string => stale !== undefined && existsSync(stale))

  for (const name of PDD_KIT_SKILLS) installSkill(sourceRoot, skillsDir, name)
  for (const stale of staleSkills) {
    if (existsSync(stale)) rmSync(stale, { recursive: true, force: true })
  }

  const now = new Date().toISOString()
  writeManifest(skillsDir, {
    schema: 1,
    package: PACKAGE_NAME,
    version,
    provider: target.provider.id,
    scope: target.scope,
    skills: [...PDD_KIT_SKILLS],
    installedAt: existing?.installedAt ?? now,
    updatedAt: now
  })

  return { ...target, skillsDir }
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
    .filter(entry => entry.isDirectory() && PDD_KIT_SKILLS.includes(entry.name as PddKitSkill))
    .map(entry => entry.name)
    .sort()
}

/** A skills directory `update` cannot refresh, and what the reader can do about it. */
export interface UnmanagedInstallation {
  provider: Provider
  scope: InstallScope
  skillsDir: string
  message: string
}

function unmanagedMessage(
  skillsDir: string,
  target: InstallTarget,
  marker: SkillsDirMarker,
  display: (path: string) => string
): string | undefined {
  const where = display(skillsDir)
  if (marker.kind === 'other-package') {
    return `${where} has pdd-kit skills installed by another package, ${marker.packageName}, which this version does not manage. `
      + `Run \`${reinstallCommand(target, true)}\` once to replace them.`
  }
  if (marker.kind === 'invalid') {
    return `${display(marker.file)} is ${marker.reason}, so pdd-kit cannot tell which skills it installed in ${where}. `
      + `If you own that directory, run \`${reinstallCommand(target, true)}\` to reinstall them.`
  }
  return undefined
}

/**
 * Skills directories with a marker `update` will not act on: one another
 * package wrote, one that cannot be read, or a managed install in a location its harness no longer reads. Found only
 * to be named; nothing here is migrated.
 */
export function findUnmanagedInstallations(
  cwd: string,
  providers: Provider[],
  scopes: InstallScope[],
  display: (path: string) => string,
  home = homedir()
): UnmanagedInstallation[] {
  const found: UnmanagedInstallation[] = []
  const seen = new Set<string>()
  for (const scope of scopes) {
    for (const provider of providers) {
      const target = { provider, scope }
      const skillsDir = providerSkillsDir(provider, scope, cwd, home)
      if (!seen.has(skillsDir)) {
        seen.add(skillsDir)
        const message = unmanagedMessage(skillsDir, target, inspectSkillsDir(skillsDir), display)
        if (message) found.push({ provider, scope, skillsDir, message })
      }
      if (scope !== 'global') continue
      for (const retired of provider.retiredGlobalSkillsDirs?.(home) ?? []) {
        if (seen.has(retired) || retired === skillsDir) continue
        seen.add(retired)
        const marker = inspectSkillsDir(retired)
        const recorded = marker.kind === 'managed' ? marker.manifest.skills : marker.kind === 'other-package' ? marker.skills : undefined
        const message = recorded
          ? `${display(retired)} holds pdd-kit skills where ${provider.name} no longer looks for them; it now reads ${display(skillsDir)}. `
            + `Run \`${reinstallCommand(target, false)}\`, then delete ${[...recorded, MANIFEST_FILE].join(', ')} from ${display(retired)}.`
          : undefined
        if (message) found.push({ provider, scope, skillsDir: retired, message })
      }
    }
  }
  return found
}
