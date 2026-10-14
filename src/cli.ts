#!/usr/bin/env node
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { Command, CommanderError, Help, InvalidArgumentError } from 'commander'
import { runContribute } from './commands/contribute.js'
import { runExport } from './commands/export.js'
import { runInstall } from './commands/install.js'
import { runLint } from './commands/lint.js'
import { runList } from './commands/list.js'
import { runOpen } from './commands/open.js'
import { runPull } from './commands/pull.js'
import { runUpdate } from './commands/update.js'
import { runView } from './commands/view.js'
import { checkForCliUpdate } from './core/cli-update.js'
import { UsageError } from './core/usage-error.js'
import { cliVersion } from './version.js'

interface InstallCliOptions {
  providers?: string
  scope?: string
  yes?: boolean
  force?: boolean
  orchestrate?: 'on' | 'off'
}

interface UpdateCliOptions {
  providers?: string
  scope?: string
  force?: boolean
  orchestrate?: 'on' | 'off'
}

interface LintCliOptions {
  json?: boolean
}

interface ViewCliOptions {
  open: boolean
  port?: number
  branch?: string
  pr?: number
}

interface ForceCliOptions {
  force?: boolean
}

interface ContributeCliOptions {
  yes?: boolean
}

/** Ends the invocation before its command runs, with this exit code. */
class StopInvocation extends Error {
  constructor(readonly exitCode: number) {
    super()
  }
}

function cwdFor(command: Command): string {
  const { cwd } = command.optsWithGlobals() as { cwd?: string }
  const directory = resolve(process.cwd(), cwd || '.')
  if (cwd !== undefined && !isDirectory(directory)) {
    throw new UsageError(`${directory} ${existsSync(directory) ? 'is not a directory' : 'does not exist'}. Pass an existing directory to --cwd.`)
  }
  return directory
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function scope(value: string): 'project' | 'global' {
  const normalized = value.trim().toLowerCase()
  if (normalized !== 'project' && normalized !== 'global') {
    throw new InvalidArgumentError('expected "project" or "global"')
  }
  return normalized
}

function orchestrate(value: string): 'on' | 'off' {
  const normalized = value.trim().toLowerCase()
  if (normalized !== 'on' && normalized !== 'off') {
    throw new InvalidArgumentError('expected "on" or "off"')
  }
  return normalized
}

function port(value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new InvalidArgumentError('expected an integer from 1 to 65535')
  }
  const parsed = Number(value)
  if (parsed < 1 || parsed > 65535) {
    throw new InvalidArgumentError('expected an integer from 1 to 65535')
  }
  return parsed
}

function pullRequestNumber(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new InvalidArgumentError('expected a positive pull request number')
  }
  return Number(value)
}

function commandsBeforeOptions(output: string): string {
  const trailingNewline = output.endsWith('\n') ? '\n' : ''
  const sections = output.trimEnd().split(/\n{2,}/)
  const commands = sections.findIndex(section => section.startsWith('Commands:'))
  const options = sections.findIndex(section => section.startsWith('Options:'))
  if (commands < 0 || options < 0 || commands < options) return output

  const [commandSection] = sections.splice(commands, 1)
  sections.splice(options, 0, commandSection!)
  return sections.join('\n\n') + trailingNewline
}

function createProgram(setExitCode: (code: number) => void): Command {
  const program = new Command()
    .name('pdd-kit')
    .description('Product-Driven Development for coding agents')
    .usage('<command> [options]')
    .option('-c, --cwd <path>', 'Run from another directory')
    .version(cliVersion(), '-V, --version', 'Show the CLI version')
    .helpOption('-h, --help', 'Show help for command')
    .helpCommand('help [command]', 'Show help for command')
    .showSuggestionAfterError()
    .configureHelp({
      showGlobalOptions: true,
      formatHelp(command, helper) {
        const output = Help.prototype.formatHelp.call(helper, command, helper)
        return command.parent ? output : commandsBeforeOptions(output)
      }
    })
    .exitOverride()
    .hook('preAction', async (_program, action) => {
      if (action.name() === 'blueprint') return
      const exitCode = await checkForCliUpdate()
      if (exitCode !== undefined) throw new StopInvocation(exitCode)
    })

  program
    .command('install')
    .summary('Install pdd-kit skills')
    .description('Install pdd-kit skills for detected AI harnesses.')
    .option('--providers <list>', 'Comma-separated providers: claude,codex,cursor,gemini,github')
    .option('--scope <scope>', 'Installation scope: project or global', scope)
    .option('--yes', 'Accept detected providers, project scope and the current orchestration')
    .option('--force', 'Replace an unmarked colliding pdd-kit skill directory')
    .option('--orchestrate <state>', 'Let pdd-verify orchestrate implementation: on or off', orchestrate)
    .action(async (options: InstallCliOptions, command: Command) => {
      setExitCode(await runInstall(cwdFor(command), options))
    })

  program
    .command('update')
    .summary('Update managed skill installations')
    .description('Update pdd-kit-managed skill installations.')
    .option('--providers <list>', 'Limit discovery to: claude,codex,cursor,gemini,github')
    .option('--scope <scope>', 'Installation scope: project or global', scope)
    .option('--force', 'Replace an unmarked collision inside a managed installation')
    .option('--orchestrate <state>', 'Turn orchestration on or off; omitted keeps each installation\'s setting', orchestrate)
    .action(async (options: UpdateCliOptions, command: Command) => {
      setExitCode(await runUpdate(cwdFor(command), options))
    })

  program
    .command('lint')
    .summary('Lint a Product Model')
    .description('Lint the current product-model/ Product Model.')
    .option('--json', 'Write the lint result as JSON')
    .action((options: LintCliOptions, command: Command) => {
      setExitCode(runLint(cwdFor(command), Boolean(options.json)))
    })

  program
    .command('view [repository]')
    .summary('View a Product Model locally')
    .description('View the current Product Model, or a GitHub repository\'s, on localhost.')
    .option('--no-open', 'Do not open the default browser')
    .option('--port <port>', 'Port to listen on', port)
    .option('--branch <name>', 'Branch or tag of the GitHub repository')
    .option('--pr <number>', 'Pull request of the GitHub repository to view', pullRequestNumber)
    .action(async (repository: string | undefined, options: ViewCliOptions, command: Command) => {
      const { cwd } = command.optsWithGlobals() as { cwd?: string }
      setExitCode(await runView(cwdFor(command), {
        ...options,
        repository,
        explicitCwd: cwd !== undefined
      }))
    })

  const blueprint = program
    .command('blueprint')
    .summary('Move Product Models between repositories')
    .description('Export, open, list, pull, or contribute portable Product Model Blueprints.')
    .usage('<command> [options]')
    .helpOption('-h, --help', 'Show help for command')
    .helpCommand('help [command]', 'Show help for command')
    .argument('[command]')
    .action((unknown: string | undefined, _options: Record<string, never>, command: Command) => {
      if (unknown) command.error(`error: unknown command '${unknown}' for 'pdd-kit blueprint'`)
      command.outputHelp()
    })

  blueprint
    .command('export')
    .summary('Export a Blueprint')
    .description('Compile product-model/ into a portable Product Report.')
    .action((_: Record<string, never>, command: Command) => {
      setExitCode(runExport(cwdFor(command)))
    })

  blueprint
    .command('open <report>')
    .summary('Open a local Blueprint')
    .description('Expand a local Product Report into product-model/.')
    .option('--force', 'Back up and replace a non-empty product-model/ directory')
    .action(async (report: string, options: ForceCliOptions, command: Command) => {
      setExitCode(await runOpen(cwdFor(command), report, Boolean(options.force)))
    })

  blueprint
    .command('list')
    .summary('List published Blueprints')
    .description('List the Blueprints that blueprint pull can fetch.')
    .action(async () => {
      setExitCode(await runList())
    })

  blueprint
    .command('pull <name>')
    .summary('Pull a published Blueprint')
    .description('Pull a published Blueprint into product-model/.')
    .option('--force', 'Back up and replace a non-empty product-model/ directory')
    .action(async (name: string, options: ForceCliOptions, command: Command) => {
      setExitCode(await runPull(cwdFor(command), name, { force: Boolean(options.force) }))
    })

  blueprint
    .command('contribute')
    .summary('Contribute a Blueprint')
    .description('Propose the current Product Model as a Blueprint, by pull request.')
    .option('--yes', 'Skip the confirmation prompt')
    .action(async (options: ContributeCliOptions, command: Command) => {
      setExitCode(await runContribute(cwdFor(command), { yes: Boolean(options.yes) }))
    })

  return program
}

async function main(argv = process.argv): Promise<number> {
  let exitCode = 0
  const program = createProgram(code => { exitCode = code })

  if (argv.length === 2) {
    program.outputHelp()
    return 0
  }

  try {
    await program.parseAsync(argv)
    return exitCode
  } catch (error) {
    if (error instanceof StopInvocation) return error.exitCode
    if (error instanceof CommanderError) {
      return error.exitCode === 0 || error.code === 'commander.help' ? 0 : 2
    }
    console.error(`error: ${(error as Error).message}`)
    return error instanceof UsageError ? 2 : 1
  }
}

main().then((code) => {
  process.exitCode = code
}, (error) => {
  console.error(`error: ${(error as Error).message}`)
  process.exitCode = 1
})
