import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { UsageError } from './usage-error.js'

export type ProviderId = 'claude' | 'codex' | 'cursor' | 'gemini' | 'github'
export type InstallScope = 'project' | 'global'

export interface Provider {
  id: ProviderId
  name: string
  projectRoot: string
  projectSkillsDir: string
  globalHarnessDirs: (home: string) => string[]
  globalSkillsDir: (home: string) => string
}

const envHome = (name: string, fallback: string): string =>
  process.env[name]?.trim() || fallback

export const PROVIDERS: Provider[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    projectRoot: '.claude',
    projectSkillsDir: join('.claude', 'skills'),
    globalHarnessDirs: home => [envHome('CLAUDE_CONFIG_DIR', join(home, '.claude'))],
    globalSkillsDir: home => join(envHome('CLAUDE_CONFIG_DIR', join(home, '.claude')), 'skills')
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    projectRoot: '.agents',
    projectSkillsDir: join('.agents', 'skills'),
    globalHarnessDirs: home => [envHome('CODEX_HOME', join(home, '.codex'))],
    globalSkillsDir: home => join(envHome('CODEX_HOME', join(home, '.codex')), 'skills')
  },
  {
    id: 'cursor',
    name: 'Cursor',
    projectRoot: '.cursor',
    projectSkillsDir: join('.cursor', 'skills'),
    globalHarnessDirs: home => [join(home, '.cursor')],
    globalSkillsDir: home => join(home, '.cursor', 'skills')
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    projectRoot: '.gemini',
    projectSkillsDir: join('.gemini', 'skills'),
    globalHarnessDirs: home => [join(home, '.gemini')],
    globalSkillsDir: home => join(home, '.gemini', 'skills')
  },
  {
    id: 'github',
    name: 'GitHub Copilot',
    projectRoot: '.github',
    projectSkillsDir: join('.github', 'skills'),
    globalHarnessDirs: home => [join(home, '.copilot'), join(home, '.github')],
    globalSkillsDir: home => join(home, '.copilot', 'skills')
  }
]

const PROVIDER_ALIASES: Record<string, ProviderId> = {
  agents: 'codex',
  claude: 'claude',
  'claude-code': 'claude',
  codex: 'codex',
  copilot: 'github',
  cursor: 'cursor',
  gemini: 'gemini',
  github: 'github'
}

export interface DetectedProvider {
  provider: Provider
  detectedAt: string
  source: 'project' | 'global'
}

export function providerById(id: ProviderId): Provider {
  return PROVIDERS.find(provider => provider.id === id)!
}

export function parseProviderIds(input: string | undefined): ProviderId[] | undefined {
  if (input === undefined) return undefined
  const tokens = input.split(',').map(token => token.trim().toLowerCase()).filter(Boolean)
  if (tokens.length === 0) throw new UsageError('--providers requires at least one provider.')

  const ids: ProviderId[] = []
  const invalid: string[] = []
  for (const token of tokens) {
    const id = PROVIDER_ALIASES[token]
    if (!id) invalid.push(token)
    else if (!ids.includes(id)) ids.push(id)
  }
  if (invalid.length > 0) {
    throw new UsageError(
      `Unknown provider(s): ${invalid.join(', ')}. Supported providers: ${PROVIDERS.map(provider => provider.id).join(', ')}.`
    )
  }
  return ids
}

export function detectProviders(cwd: string, home = homedir()): DetectedProvider[] {
  const project = resolve(cwd)
  const detected: DetectedProvider[] = []
  for (const provider of PROVIDERS) {
    const projectPath = join(project, provider.projectRoot)
    if (existsSync(projectPath)) {
      detected.push({ provider, detectedAt: projectPath, source: 'project' })
      continue
    }
    const globalPath = provider.globalHarnessDirs(home).find(candidate => existsSync(candidate))
    if (globalPath) {
      detected.push({ provider, detectedAt: globalPath, source: 'global' })
    }
  }
  return detected
}

export function providerSkillsDir(
  provider: Provider,
  scope: InstallScope,
  cwd: string,
  home = homedir()
): string {
  return scope === 'project'
    ? join(resolve(cwd), provider.projectSkillsDir)
    : provider.globalSkillsDir(home)
}

export function formatDisplayPath(path: string, home = homedir()): string {
  const resolvedHome = resolve(home)
  const resolvedPath = resolve(path)
  if (resolvedPath === resolvedHome) return '~'
  if (resolvedPath.startsWith(`${resolvedHome}${sep}`)) return `~${resolvedPath.slice(resolvedHome.length)}`
  return resolvedPath
}
