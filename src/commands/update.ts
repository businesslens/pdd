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

export interface UpdateOptions {
  providers?: string
  scope?: string
  project?: boolean
  global?: boolean
  user?: boolean
  force?: boolean
}

function resolveScopes(options: UpdateOptions): InstallScope[] {
  const aliases = [
    options.project ? 'project' : undefined,
    options.global || options.user ? 'global' : undefined
  ].filter(Boolean)
  if (aliases.length > 1) throw new Error('Choose only one of --project, --global, or --user.')

  if (!options.scope && aliases.length === 0) return ['project', 'global']
  const normalized = options.scope?.trim().toLowerCase()
  if (normalized && normalized !== 'project' && normalized !== 'global' && normalized !== 'user') {
    throw new Error('--scope must be project or global.')
  }
  const scope = normalized === 'user' ? 'global' : normalized
  if (scope && aliases[0] && scope !== aliases[0]) {
    throw new Error('--scope conflicts with the selected scope flag.')
  }
  if ((scope || aliases[0]) === 'project') return ['project']
  if ((scope || aliases[0]) === 'global') return ['global']
  throw new Error('--scope must be project or global.')
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
    console.log('The product map and AGENTS.md were not changed.')
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
}
