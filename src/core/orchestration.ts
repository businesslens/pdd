import { cliCommand } from './invocation.js'
import { UsageError } from './usage-error.js'

/**
 * Whether the installed `pdd-verify` orchestrates implementation: plans the
 * work from the model in phases, hands each to the user's agent, and checks it
 * before the next. Off by default, because implementing is the user's own
 * workflow; the user turns it on with `--orchestrate=on`.
 *
 * An installed skill is the one place pdd-kit may record it, since it owns that
 * directory and writes nothing the repository owns. Two lines carry it. The
 * description decides whether an agent picks verify for "implement X" at all;
 * the setting line is what verify's own body reads before it enters the loop.
 * The orchestration itself lives in the skill and is the same either way.
 *
 * The source skill in `skills/` ships off, so the Claude plugin and a hand-copied
 * skill get the default.
 */
export type Orchestration = 'on' | 'off'

export function isOrchestration(value: unknown): value is Orchestration {
  return value === 'on' || value === 'off'
}

/** Read `--orchestrate` from command options, where it is still a string. */
export function resolveOrchestration(value: string | undefined): Orchestration | undefined {
  if (value === undefined) return undefined
  const normalized = value.trim().toLowerCase()
  if (!isOrchestration(normalized)) throw new UsageError('--orchestrate must be on or off.')
  return normalized
}

export function orchestrationLine(setting: Orchestration): string {
  return `Orchestration for this install: ${setting}.`
}

/**
 * Verify's description with orchestration on. It keeps everything the default
 * description catches and adds implement and build requests, which by default
 * are the user's own workflow.
 */
export const ORCHESTRATED_VERIFY_DESCRIPTION = 'Check that a product-model/ Product Model (PDD) and the code agree, report every gap, and resolve the ones the user chooses until they are aligned or explicitly blocked; implement the model in phases, checking each part before the next. Use when asked to implement or build any part of the product a product-model/ describes. This install orchestrates implementation, so plan it here in phases and have the agent implement each one in its usual way, unless the request says to implement without pdd-verify. Use when the user asks to check, verify or audit the code against the Product Model or PDD — after a change they implemented, after refactors, on suspected drift, before release, for a branch-scoped change, or for a named/full current-state audit. Use “report only” when no writes or code changes are allowed.'

const DESCRIPTION_LINE = /^description: .*$/m

/**
 * The `pdd-verify` SKILL.md to install with orchestration on: the shipped one
 * with its description and setting line swapped, and nothing else. Computed
 * before anything is written, so a skill that cannot take the setting stops
 * the install instead of leaving it half replaced. A source without exactly one
 * of each is not the skill this version ships.
 */
export function orchestratedVerifySkill(source: string, file: string): string {
  const off = orchestrationLine('off')
  if (source.split(off).length !== 2 || (source.match(new RegExp(DESCRIPTION_LINE, 'gm'))?.length ?? 0) !== 1) {
    throw new Error(`${file} is not the pdd-verify skill this version ships, so orchestration cannot be set in it. Reinstall the pdd-kit package.`)
  }
  // Replacer functions, so a `$` in either string is never read as a pattern.
  return source
    .replace(DESCRIPTION_LINE, () => `description: ${ORCHESTRATED_VERIFY_DESCRIPTION}`)
    .replace(off, () => orchestrationLine('on'))
}

/**
 * The line `install` and `update` end with: the setting, what it means, and the
 * command that flips it, so undoing it never needs the documentation. The
 * command is narrowed to the harnesses and scope the run was given, so it
 * changes what was just reported and nothing else on the machine.
 */
export function orchestrationSummary(
  installs: { orchestrate: Orchestration, location: string }[],
  narrowing: { providers?: string[], scope?: string } = {}
): string {
  const flip = (setting: Orchestration) => cliCommand([
    'update',
    ...(narrowing.providers?.length ? [`--providers ${narrowing.providers.join(',')}`] : []),
    ...(narrowing.scope ? [`--scope ${narrowing.scope}`] : []),
    `--orchestrate=${setting}`
  ].join(' '))
  const on = installs.filter(install => install.orchestrate === 'on').map(install => install.location)
  const off = installs.filter(install => install.orchestrate === 'off').map(install => install.location)
  if (on.length > 0 && off.length > 0) {
    return `Orchestration: on in ${on.join(', ')}; off in ${off.join(', ')}. `
      + `Set it for all of them with \`${flip('on')}\` or \`${flip('off')}\`.`
  }
  return on.length > 0
    ? `Orchestration: on. Your agent implements your usual way; pdd-kit splits the work into phases and pdd-verify checks each before the next. Turn it off with \`${flip('off')}\`.`
    : `Orchestration: off. Your agent implements your usual way, and you run /pdd-verify when you want a check. Turn orchestration on with \`${flip('on')}\`.`
}
