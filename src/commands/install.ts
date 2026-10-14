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
  PDD_KIT_SKILLS,
  assertInstallTargets,
  currentOrchestration,
  installSkillsToTarget,
  type InstallTarget
} from '../core/skill-installation.js'
import {
  orchestrationSummary,
  resolveOrchestration,
  type Orchestration
} from '../core/orchestration.js'
import { cliVersion } from '../version.js'
import { UsageError } from '../core/usage-error.js'

export interface InstallOptions {
  providers?: string
  scope?: string
  yes?: boolean
  force?: boolean
  orchestrate?: string
}

function canPrompt(options: InstallOptions): boolean {
  return !options.yes && Boolean(process.stdin.isTTY && process.stdout.isTTY)
}

function resolveScope(options: InstallOptions): InstallScope | undefined {
  const scope = options.scope?.trim().toLowerCase()
  if (scope && scope !== 'project' && scope !== 'global') {
    throw new UsageError('--scope must be project or global.')
  }
  return scope as InstallScope | undefined
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

/*
 * Asked last, once the targets are known to be writable, so nobody answers a
 * question for an install that is then refused. Without a terminal, or with
 * `--yes`, each target keeps what it has, which for a first install is off.
 */
async function selectOrchestration(
  cwd: string,
  targets: InstallTarget[],
  options: InstallOptions,
  explicit: Orchestration | undefined
): Promise<Orchestration | undefined | null> {
  if (explicit) return explicit
  if (!canPrompt(options)) return undefined

  const current = new Set(targets.map(target => currentOrchestration(cwd, target)))
  const selected = await select({
    // The second line answers the misreading the choice invites: orchestration
    // changes when the code is checked, never how the agent implements it.
    message: 'How should pdd-kit fit into implementation?\nYour agent implements your usual way either way.',
    options: [
      {
        value: 'off',
        label: 'Check on request',
        hint: 'you run /pdd-verify when you want'
      },
      {
        value: 'on',
        label: 'Orchestrated',
        hint: 'pdd-kit splits the work into phases and pdd-verify checks each before the next'
      }
    ],
    initialValue: current.size === 1 ? [...current][0] : 'off'
  })
  if (isCancel(selected)) {
    cancel('Installation cancelled.')
    return null
  }
  return selected as Orchestration
}

export async function runInstall(cwd: string, options: InstallOptions = {}): Promise<number> {
  try {
    const explicitOrchestration = resolveOrchestration(options.orchestrate)
    const providerIds = await selectProviders(cwd, options)
    if (!providerIds) return 1
    const scope = await selectScope(options)
    if (!scope) return 1

    // Every harness is checked before any is written, so a refusal names the
    // directory that blocked the run and nothing on disk has changed.
    const targets = providerIds.map(id => ({ provider: providerById(id), scope }))
    assertInstallTargets(cwd, targets, { force: options.force })
    const orchestrate = await selectOrchestration(cwd, targets, options, explicitOrchestration)
    if (orchestrate === null) return 1

    const progress = process.stdout.isTTY ? spinner() : undefined
    progress?.start('Installing pdd-kit skills...')
    const results = providerIds.map(id => installSkillsToTarget(
      cwd,
      { provider: providerById(id), scope },
      cliVersion(),
      { force: options.force, orchestrate }
    ))
    progress?.stop('pdd-kit skills installed.')

    const roots = results.map(result =>
      formatDisplayPath(dirname(result.skillsDir))
    )
    console.log(`Installed pdd-kit into: ${roots.join(', ')} (${scope}).`)
    console.log(`Installed skills: ${PDD_KIT_SKILLS.join(', ')}.`)
    console.log(orchestrationSummary(results.map(result => ({
      orchestrate: result.orchestrate,
      location: formatDisplayPath(dirname(result.skillsDir))
    })), { providers: providerIds, scope }))
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return error instanceof UsageError ? 2 : 1
  }
}
