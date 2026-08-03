import {
  cancel,
  isCancel,
  multiselect,
  select,
  spinner
} from '@clack/prompts'
import { dirname } from 'node:path'
import {
  PROVIDERS,
  detectProviders,
  formatDisplayPath,
  parseProviderIds,
  providerById,
  type InstallScope,
  type ProviderId
} from '../core/providers.js'
import {
  BUSINESSLENS_SKILLS,
  installSkillsToTarget
} from '../core/skill-installation.js'
import { cliVersion } from '../version.js'
import { UsageError } from '../core/usage-error.js'

export interface InstallOptions {
  providers?: string
  scope?: string
  project?: boolean
  global?: boolean
  user?: boolean
  yes?: boolean
  force?: boolean
}

function canPrompt(options: InstallOptions): boolean {
  return !options.yes && Boolean(process.stdin.isTTY && process.stdout.isTTY)
}

function resolveScope(options: InstallOptions): InstallScope | undefined {
  const aliases = [
    options.project ? 'project' : undefined,
    options.global || options.user ? 'global' : undefined
  ].filter(Boolean)
  if (aliases.length > 1) throw new UsageError('Choose only one of --project, --global, or --user.')

  const explicit = options.scope?.trim().toLowerCase()
  if (explicit && explicit !== 'project' && explicit !== 'global' && explicit !== 'user') {
    throw new UsageError('--scope must be project or global.')
  }
  const normalized = explicit === 'user' ? 'global' : explicit
  const alias = aliases[0]
  if (normalized && alias && normalized !== alias) {
    throw new UsageError('--scope conflicts with the selected scope flag.')
  }
  return (normalized || alias) as InstallScope | undefined
}

function printDetected(cwd: string): ReturnType<typeof detectProviders> {
  const detected = detectProviders(cwd)
  console.log()
  console.log('◇ Detected harnesses')
  if (detected.length === 0) {
    console.log('  None detected — Claude Code and Codex are the recommended defaults.')
  } else {
    const width = Math.max(...detected.map(item => item.provider.name.length))
    for (const item of detected) {
      console.log(`  ${item.provider.name.padEnd(width)}  ${formatDisplayPath(item.detectedAt)}`)
    }
  }
  console.log()
  return detected
}

async function selectProviders(cwd: string, options: InstallOptions): Promise<ProviderId[] | undefined> {
  const explicit = parseProviderIds(options.providers)
  const detected = printDetected(cwd)
  if (explicit) return explicit

  const detectedIds = detected.map(item => item.provider.id)
  const defaults: ProviderId[] = detectedIds.length > 0 ? detectedIds : ['claude', 'codex']
  if (!canPrompt(options)) {
    if (options.yes) return defaults
    console.error('Interactive installation requires a terminal. Pass --yes or --providers <list>.')
    return undefined
  }

  const mode = await select({
    message: 'Install for detected harnesses only, or add more?',
    options: [
      {
        value: 'detected',
        label: 'Detected only',
        hint: defaults.join(', ')
      },
      {
        value: 'customize',
        label: 'Customize...'
      }
    ]
  })
  if (isCancel(mode)) {
    cancel('Installation cancelled.')
    return undefined
  }
  if (mode === 'detected') return defaults

  const selected = await multiselect({
    message: 'Select AI harnesses',
    options: PROVIDERS.map(provider => ({
      value: provider.id,
      label: provider.name
    })),
    initialValues: defaults,
    required: true
  })
  if (isCancel(selected)) {
    cancel('Installation cancelled.')
    return undefined
  }
  return selected as ProviderId[]
}

async function selectScope(options: InstallOptions): Promise<InstallScope | undefined> {
  const explicit = resolveScope(options)
  if (explicit) return explicit
  if (!canPrompt(options)) {
    if (options.yes) return 'project'
    console.error('Interactive installation requires a terminal. Pass --scope project|global.')
    return undefined
  }

  const selected = await select({
    message: 'Installation scope',
    options: [
      {
        value: 'project',
        label: 'Project',
        hint: 'Install in the current repository'
      },
      {
        value: 'global',
        label: 'Global',
        hint: 'Install for this user'
      }
    ]
  })
  if (isCancel(selected)) {
    cancel('Installation cancelled.')
    return undefined
  }
  return selected as InstallScope
}

export async function runInstall(cwd: string, options: InstallOptions = {}): Promise<number> {
  try {
    const providerIds = await selectProviders(cwd, options)
    if (!providerIds) return 1
    const scope = await selectScope(options)
    if (!scope) return 1

    const progress = process.stdout.isTTY ? spinner() : undefined
    progress?.start('Installing BusinessLens skills...')
    const results = providerIds.map(id => installSkillsToTarget(
      cwd,
      { provider: providerById(id), scope },
      cliVersion(),
      { force: options.force }
    ))
    progress?.stop('BusinessLens skills installed.')

    const roots = results.map(result =>
      formatDisplayPath(dirname(result.skillsDir))
    )
    console.log(`Installed BusinessLens into: ${roots.join(', ')} (${scope}).`)
    console.log(`Installed skills: ${BUSINESSLENS_SKILLS.join(', ')}.`)
    const removed = results.flatMap(result => result.removedLegacySkills)
    if (removed.length > 0) {
      console.log(`Removed retired BusinessLens skills: ${[...new Set(removed)].join(', ')}.`)
    }
    const removedCommands = results.flatMap(result => result.removedLegacyCommands)
    if (removedCommands.length > 0) {
      console.log(`Removed retired BusinessLens commands: ${[...new Set(removedCommands)].join(', ')}.`)
    }
    console.log()
    console.log('Done! Run /businesslens-map for established code or /businesslens-ideate for a new product.')
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return error instanceof UsageError ? 2 : 1
  }
}
