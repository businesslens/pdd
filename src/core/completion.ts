import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Argument, Command, Option } from 'commander'
import { packageRoot } from '../version.js'

/** Shells `businesslens completion <shell>` prints a script for. */
export const COMPLETION_SHELLS = ['bash', 'zsh', 'fish'] as const
export type CompletionShell = typeof COMPLETION_SHELLS[number]

/**
 * The internal entry the printed scripts call on Tab. It is answered in `main`
 * before Commander parses anything, so it never runs a command action or the
 * update check, and it is not a command of its own.
 */
export const COMPLETE_ENTRY = '__complete'

export interface CompletionValue {
  value: string
  description?: string
}

/** How an option value or argument completes when its values are not known. */
export type ValueCompletion =
  | { values: readonly CompletionValue[], list?: boolean }
  | { native: 'directories' }
  | { native: 'files', extension?: string }

export interface Completion {
  candidates: CompletionValue[]
  native?: 'directories' | 'files'
  extension?: string
}

const declared = new WeakMap<Option | Argument, ValueCompletion>()

/**
 * Declare how `target` completes, beside its definition. An undeclared value
 * completes from its Commander choices, or not at all.
 */
export function completes<T extends Option | Argument>(target: T, completion: ValueCompletion): T {
  declared.set(target, completion)
  return target
}

const NOTHING: Completion = { candidates: [] }

function summary(command: Command): string {
  return command.summary() || command.description()
}

/** Options `command` accepts, including those of its ancestors, as help shows them. */
function acceptedOptions(command: Command): Option[] {
  const help = command.createHelp()
  return [...help.visibleOptions(command), ...help.visibleGlobalOptions(command)]
}

function findOption(command: Command, flag: string): Option | undefined {
  return acceptedOptions(command).find(option => option.long === flag || option.short === flag)
}

function valueCompletion(target: Option | Argument, current: string): Completion {
  const completion: ValueCompletion | undefined = declared.get(target)
    ?? (target.argChoices ? { values: target.argChoices.map(value => ({ value })) } : undefined)
  if (!completion) return NOTHING
  if ('native' in completion) {
    return completion.native === 'files'
      ? { candidates: [], native: 'files', ...(completion.extension ? { extension: completion.extension } : {}) }
      : { candidates: [], native: 'directories' }
  }
  if (!completion.list) return { candidates: [...completion.values] }
  // A comma-separated list keeps what is already chosen and offers the rest.
  const chosen = current.split(',').slice(0, -1)
  const prefix = chosen.length ? `${chosen.join(',')},` : ''
  return {
    candidates: completion.values
      .filter(({ value }) => !chosen.includes(value))
      .map(({ value, description }) => ({ value: prefix + value, ...(description ? { description } : {}) }))
  }
}

function optionCandidates(command: Command, used: Set<Option>, current: string): CompletionValue[] {
  return acceptedOptions(command)
    .filter(option => !used.has(option) || option.variadic)
    .flatMap(option => {
      const flags = current.startsWith('-') && !current.startsWith('--') ? [option.long, option.short] : [option.long]
      return flags.filter((flag): flag is string => Boolean(flag))
        .map(value => ({ value, description: option.description }))
    })
}

/**
 * What can follow `words`, the arguments typed after `businesslens`; the last
 * word is the one being completed and may be empty. Everything is read from the
 * Commander tree, so completion offers exactly what help documents.
 */
export function complete(program: Command, words: readonly string[]): Completion {
  const current = words.at(-1) ?? ''
  let command = program
  let positionals = 0
  let helpTopic = false
  let pending: Option | undefined
  let terminated = false
  const used = new Set<Option>()

  for (const word of words.slice(0, -1)) {
    if (pending) {
      pending = undefined
      continue
    }
    if (!terminated && word === '--') {
      terminated = true
      continue
    }
    if (!terminated && word.startsWith('-') && word !== '-') {
      const equals = word.indexOf('=')
      const option = findOption(command, equals > 0 ? word.slice(0, equals) : word)
      if (!option) continue
      used.add(option)
      if (option.required && equals < 0) pending = option
      continue
    }
    if (!helpTopic && positionals === 0) {
      const subcommand = command.createHelp().visibleCommands(command)
        .find(candidate => candidate.name() === word || candidate.aliases().includes(word))
      if (subcommand && !command.commands.includes(subcommand)) {
        // The built-in `help [command]` names a sibling command.
        helpTopic = true
        continue
      }
      if (subcommand) {
        command = subcommand
        continue
      }
    }
    positionals += 1
  }

  if (pending) return valueCompletion(pending, current)
  if (!terminated && current.startsWith('-')) {
    const equals = current.indexOf('=')
    if (current.startsWith('--') && equals > 0) {
      const option = findOption(command, current.slice(0, equals))
      return option?.required || option?.optional ? valueCompletion(option, current.slice(equals + 1)) : NOTHING
    }
    return { candidates: optionCandidates(command, used, current) }
  }

  const subcommands = command.createHelp().visibleCommands(command)
  if (helpTopic || subcommands.length) {
    if (positionals > 0) return NOTHING
    return {
      candidates: subcommands
        .filter(subcommand => !helpTopic || command.commands.includes(subcommand))
        .map(subcommand => ({ value: subcommand.name(), description: summary(subcommand) }))
    }
  }

  const last = command.registeredArguments.at(-1)
  const argument = command.registeredArguments[positionals] ?? (last?.variadic ? last : undefined)
  const completion = argument ? valueCompletion(argument, current) : NOTHING
  if (completion.candidates.length || completion.native || current) return completion
  // Nothing to suggest for this argument: an empty word discovers the options.
  return { candidates: optionCandidates(command, used, current) }
}

function line(text: string): string {
  return text.replace(/[\t\r\n]+/g, ' ').trim()
}

/**
 * The protocol the printed scripts read: one candidate per line, with an
 * optional description after a tab, then a directive line naming what the
 * shell completes natively: `:none`, `:directories`, `:files` or `:files:<ext>`.
 */
export function formatCompletion(completion: Completion): string {
  const lines = completion.candidates.map(({ value, description }) =>
    description ? `${line(value)}\t${line(description)}` : line(value))
  const directive = completion.native === 'files' && completion.extension
    ? `:files:${completion.extension}`
    : `:${completion.native ?? 'none'}`
  return [...lines, directive].join('\n') + '\n'
}

/** The completion script for `shell`, which asks the installed CLI on every Tab. */
export function completionScript(shell: CompletionShell): string {
  return readFileSync(join(packageRoot(), 'completions', `businesslens.${shell}`), 'utf8')
}
