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
  installSkillsToTarget
} from '../core/skill-installation.js'
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
    const installations = findManagedInstallations(cwd, providers, resolveScopes(options))
    if (installations.length === 0) {
      console.error('No managed BusinessLens skill installation found. Run `businesslens install` first.')
      return 1
    }

    const progress = process.stdout.isTTY ? spinner() : undefined
    progress?.start('Updating BusinessLens skills...')
    const results = installations.map(installation => installSkillsToTarget(
      cwd,
      { provider: installation.provider, scope: installation.scope },
      cliVersion(),
      { force: options.force }
    ))
    progress?.stop('BusinessLens skills updated.')

    console.log(`Updated BusinessLens in: ${results.map(result => formatDisplayPath(dirname(result.skillsDir))).join(', ')}.`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return error instanceof UsageError ? 2 : 1
  }
}
