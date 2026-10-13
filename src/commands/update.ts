import { spinner } from '@clack/prompts'
import { dirname } from 'node:path'
import {
  PROVIDERS,
  formatDisplayPath,
  parseProviderIds,
  providerById,
  type InstallScope
} from '../core/providers.js'
import {
  findManagedInstallations,
  findUnmanagedInstallations,
  installSkillsToTarget
} from '../core/skill-installation.js'
import { cliCommand } from '../core/invocation.js'
import { cliVersion } from '../version.js'
import { UsageError } from '../core/usage-error.js'

export interface UpdateOptions {
  providers?: string
  scope?: string
  force?: boolean
}

function resolveScopes(options: UpdateOptions): InstallScope[] {
  const scope = options.scope?.trim().toLowerCase()
  if (!scope) return ['project', 'global']
  if (scope === 'project' || scope === 'global') return [scope]
  throw new UsageError('--scope must be project or global.')
}

export async function runUpdate(cwd: string, options: UpdateOptions = {}): Promise<number> {
  try {
    const requested = parseProviderIds(options.providers)
    const providers = requested ? requested.map(providerById) : PROVIDERS
    const scopes = resolveScopes(options)
    const installations = findManagedInstallations(cwd, providers, scopes)
    // Installations update cannot refresh are named, never migrated.
    const unmanaged = findUnmanagedInstallations(cwd, providers, scopes, path => formatDisplayPath(path))
    if (installations.length === 0) {
      if (unmanaged.length === 0) {
        console.error(`No managed pdd-kit skill installation found. Run \`${cliCommand('install')}\` first.`)
      } else {
        console.error('No managed pdd-kit skill installation found.')
        for (const item of unmanaged) console.error(`- ${item.message}`)
      }
      return 1
    }

    const progress = process.stdout.isTTY ? spinner() : undefined
    progress?.start('Updating pdd-kit skills...')
    const results = installations.map(installation => installSkillsToTarget(
      cwd,
      { provider: installation.provider, scope: installation.scope },
      cliVersion(),
      { force: options.force }
    ))
    progress?.stop('pdd-kit skills updated.')

    console.log(`Updated pdd-kit in: ${results.map(result => formatDisplayPath(dirname(result.skillsDir))).join(', ')}.`)
    for (const item of unmanaged) console.log(`Note: ${item.message}`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return error instanceof UsageError ? 2 : 1
  }
}
