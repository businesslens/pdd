#!/usr/bin/env node
import { resolve } from 'node:path'
import { Command, CommanderError, Help, InvalidArgumentError, Option } from 'commander'
import { runContribute } from './commands/contribute.js'
import { runExport } from './commands/export.js'
import { runInstall } from './commands/install.js'
import { runLint } from './commands/lint.js'
import { runOpen } from './commands/open.js'
import { runPull } from './commands/pull.js'
import { runUpdate } from './commands/update.js'
import { runView } from './commands/view.js'
import { cliVersion } from './version.js'

interface InstallCliOptions {
  providers?: string
  scope?: string
  project?: boolean
  global?: boolean
  user?: boolean
  yes?: boolean
  force?: boolean
}

interface UpdateCliOptions {
  providers?: string
  scope?: string
  project?: boolean
  global?: boolean
  user?: boolean
  force?: boolean
}

interface LintCliOptions {
  json?: boolean
}

interface ViewCliOptions {
  open: boolean
  port?: number
}

interface ForceCliOptions {
  force?: boolean
}

interface PullCliOptions extends ForceCliOptions {
  catalog?: string
}

interface ContributeCliOptions {
  yes?: boolean
}

function cwdFor(command: Command): string {
  const { cwd, C: legacyCwd } = command.optsWithGlobals() as { cwd?: string; C?: string }
  return resolve(process.cwd(), cwd || legacyCwd || '.')
}

function scope(value: string): 'project' | 'global' {
  const normalized = value.trim().toLowerCase()
  if (normalized !== 'project' && normalized !== 'global') {
    throw new InvalidArgumentError('expected "project" or "global"')
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

function legacyScopeOptions(command: Command): Command {
  return command
    .addOption(new Option('--project').hideHelp())
    .addOption(new Option('--global').hideHelp())
    .addOption(new Option('--user').hideHelp())
}

function retiredCommand(program: Command, name: string, replacement: string): void {
  program
    .command(`${name} [arguments...]`, { hidden: true })
    .allowUnknownOption(true)
    .description(`Use businesslens ${replacement}`)
    .action((_arguments: string[], _options: Record<string, never>, command: Command) => {
      command.error(`error: \`businesslens ${name}\` has moved. Use \`businesslens ${replacement}\`.`)
    })
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
    .name('businesslens')
    .description('Product-Driven Development for coding agents')
    .usage('<command> [options]')
    .option('-c, --cwd <path>', 'Run from another directory')
    .addOption(new Option('-C <path>').hideHelp().conflicts('cwd'))
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

  legacyScopeOptions(program
    .command('install')
    .summary('Install BusinessLens skills')
    .description('Install BusinessLens skills for detected AI harnesses.')
    .option('--providers <list>', 'Comma-separated providers: claude,codex,cursor,gemini,github')
    .option('--scope <scope>', 'Installation scope: project or global', scope)
    .option('--yes', 'Accept detected providers and default to project scope')
    .option('--force', 'Replace an unmarked colliding BusinessLens skill directory'))
    .action(async (options: InstallCliOptions, command: Command) => {
      setExitCode(await runInstall(cwdFor(command), options))
    })

  legacyScopeOptions(program
    .command('update')
    .summary('Update managed skill installations')
    .description('Update BusinessLens-managed skill installations.')
    .option('--providers <list>', 'Limit discovery to: claude,codex,cursor,gemini,github')
    .option('--scope <scope>', 'Installation scope: project or global', scope)
    .option('--force', 'Replace an unmarked collision inside a managed installation'))
    .action(async (options: UpdateCliOptions, command: Command) => {
      setExitCode(await runUpdate(cwdFor(command), options))
    })

  program
    .command('lint')
    .summary('Lint a Product Model')
    .description('Lint the current .businesslens/ Product Model.')
    .option('--json', 'Write the lint result as JSON')
    .action((options: LintCliOptions, command: Command) => {
      setExitCode(runLint(cwdFor(command), Boolean(options.json)))
    })

  program
    .command('view')
    .summary('View a Product Model locally')
    .description('View the current Product Model on localhost.')
    .option('--no-open', 'Do not open the default browser')
    .option('--port <port>', 'Port to listen on', port)
    .action(async (options: ViewCliOptions, command: Command) => {
      setExitCode(await runView(cwdFor(command), options))
    })

  const blueprint = program
    .command('blueprint')
    .summary('Move Product Models between repositories')
    .description('Export, open, pull, or contribute portable Product Model Blueprints.')
    .usage('<command> [options]')
    .helpOption('-h, --help', 'Show help for command')
    .helpCommand('help [command]', 'Show help for command')
    .argument('[command]')
    .action((unknown: string | undefined, _options: Record<string, never>, command: Command) => {
      if (unknown) command.error(`error: unknown command '${unknown}' for 'businesslens blueprint'`)
      command.outputHelp()
    })

  blueprint
    .command('export')
    .summary('Export a Blueprint')
    .description('Compile .businesslens/ into a portable Product Report.')
    .action((_: Record<string, never>, command: Command) => {
      setExitCode(runExport(cwdFor(command)))
    })

  blueprint
    .command('open <report>')
    .summary('Open a local Blueprint')
    .description('Expand a local Product Report into .businesslens/.')
    .option('--force', 'Back up and replace a non-empty .businesslens/ directory')
    .action(async (report: string, options: ForceCliOptions, command: Command) => {
      setExitCode(await runOpen(cwdFor(command), report, Boolean(options.force)))
    })

  blueprint
    .command('pull <name>')
    .summary('Pull a catalog Blueprint')
    .description('Pull a Blueprint from a catalog into .businesslens/.')
    .option('--catalog <origin>', 'Catalog origin (default: BUSINESSLENS_CATALOG_URL or https://businesslens.io)')
    .option('--force', 'Back up and replace a non-empty .businesslens/ directory')
    .action(async (name: string, options: PullCliOptions, command: Command) => {
      setExitCode(await runPull(cwdFor(command), name, {
        catalog: options.catalog,
        force: Boolean(options.force)
      }))
    })

  blueprint
    .command('contribute')
    .summary('Contribute a Blueprint')
    .description('Propose the current Product Model for the Blueprint catalog.')
    .option('--yes', 'Skip the confirmation prompt')
    .action(async (options: ContributeCliOptions, command: Command) => {
      setExitCode(await runContribute(cwdFor(command), { yes: Boolean(options.yes) }))
    })

  for (const name of ['export', 'open', 'pull', 'contribute']) {
    retiredCommand(program, name, `blueprint ${name}`)
  }
  retiredCommand(program, 'build', 'blueprint export')

  program
    .command('validate [arguments...]', { hidden: true })
    .allowUnknownOption(true)
    .action((_arguments: string[], _options: Record<string, never>, command: Command) => {
      command.error('error: `businesslens validate` has been renamed. Use `businesslens lint`.')
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
    if (error instanceof CommanderError) {
      return error.exitCode === 0 || error.code === 'commander.help' ? 0 : 2
    }
    console.error(`error: ${(error as Error).message}`)
    return 1
  }
}

main().then((code) => {
  process.exitCode = code
}, (error) => {
  console.error(`error: ${(error as Error).message}`)
  process.exitCode = 1
})
