#!/usr/bin/env node
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { runExport } from './commands/export.js'
import { runInstall } from './commands/install.js'
import { runOpen } from './commands/open.js'
import { runContribute } from './commands/contribute.js'
import { runPull } from './commands/pull.js'
import { runUpdate } from './commands/update.js'
import { runValidate } from './commands/validate.js'
import { cliVersion } from './version.js'

const HELP = `businesslens — Product-Driven Development for coding agents

Usage: businesslens <command> [options]

Commands:
  install                     Install BusinessLens skills for detected AI harnesses
  update                      Refresh managed BusinessLens skill installations
  validate [--json]           Validate the .businesslens/ product model

Blueprint commands (moving a model between repositories):
  blueprint export                    Compile .businesslens/ into a source-free report
  blueprint open <report> [--force]   Expand a Blueprint into .businesslens/
  blueprint pull <name> [--force]     Pull a Blueprint from the catalog
  blueprint contribute [--yes]        Propose this Blueprint for the catalog

Install options:
  --providers <list>          Comma-separated: claude,codex,cursor,gemini,github
  --scope <scope>             project or global
  --project                   Shortcut for --scope project
  --global, --user            Shortcut for --scope global
  --yes                       Accept detected providers and project scope
  --force                     Replace an unmarked businesslens-* skill directory

Blueprint contribute options:
  --slug <name>               Catalog slug (defaults to the product id)
  --yes                       Skip the confirmation prompt (required in
                              non-interactive sessions). Requires an
                              authenticated GitHub CLI.

Blueprint open options:
  --force                     Back up a non-empty .businesslens/ before opening
                              A relative <report> path resolves against the
                              current shell directory, not against --cwd.

Blueprint pull options:
  --catalog <origin>          Catalog origin to pull from (default https://businesslens.io)
  --force                     Back up a non-empty .businesslens/ before pulling

General options:
  --cwd <path>                Run against this repository instead of the current directory
  --help                      Show this help
  --version                   Show the CLI version

Agent workflows:
  /businesslens-init          Build the initial product model from existing code
  /businesslens-ideate        Decide what to build, and write it into the model
  /businesslens-sync          Reconcile the model with the code, either way
  /businesslens-deep-dive     Expand one journey or experience
  /businesslens-doctor        Diagnose validation, drift, and coverage
  /businesslens-contribute    Propose the model as a catalog Blueprint

Exit codes: 0 success · 1 failure · 2 usage error`

/** Subcommands of `blueprint`. Refused, with guidance, when typed bare. */
const BLUEPRINT_COMMANDS = new Set(['export', 'open', 'pull', 'contribute'])

/** Positionals each command consumes after its own name. */
const ARGUMENT_COUNT: Record<string, number> = { open: 1, pull: 1 }

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    strict: true,
    options: {
      json: { type: 'boolean', default: false },
      providers: { type: 'string' },
      scope: { type: 'string' },
      project: { type: 'boolean', default: false },
      global: { type: 'boolean', default: false },
      user: { type: 'boolean', default: false },
      yes: { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      catalog: { type: 'string' },
      slug: { type: 'string' },
      cwd: { type: 'string' },
      help: { type: 'boolean', default: false },
      version: { type: 'boolean', default: false }
    }
  })

  if (values.version) {
    console.log(cliVersion())
    return 0
  }
  if (values.help || !positionals.length) {
    console.log(HELP)
    return positionals.length ? 0 : 2
  }

  // Each of these produces or consumes a Product Report and carries a model
  // across a repository boundary, which is a different job from the everyday
  // `install`/`update`/`validate` verbs.
  //
  // The bare spellings are gone rather than deprecated. Keeping `export` as an
  // alias would have blocked reusing that name for the evidenced profile later,
  // and reusing it while an alias existed would silently change a
  // disclosure-relevant default. A command that no longer exists says so.
  let command = positionals[0]!
  let rest = positionals.slice(1)
  if (command === 'blueprint') {
    command = rest[0] ?? ''
    rest = rest.slice(1)
    if (!BLUEPRINT_COMMANDS.has(command)) {
      const known = [...BLUEPRINT_COMMANDS].join(', ')
      console.error(command
        ? `Unknown blueprint command "${command}". Expected one of: ${known}.`
        : `blueprint requires a subcommand: ${known}.`)
      return 2
    }
  } else if (BLUEPRINT_COMMANDS.has(command) || command === 'build') {
    const moved = command === 'build' ? 'export' : command
    console.error(`\`businesslens ${command}\` has moved. Use \`businesslens blueprint ${moved}\`.`)
    return 2
  }

  const expected = ARGUMENT_COUNT[command] ?? 0
  if (rest.length > expected) {
    console.error(`Unexpected argument "${rest[expected]}".`)
    return 2
  }
  if (rest.length < expected) {
    console.error(command === 'open'
      ? 'open requires one local Product Report path.'
      : 'pull requires one canonical Blueprint name.')
    return 2
  }

  const cwd = resolve(process.cwd(), values.cwd || '.')
  switch (command) {
    case 'install':
      return runInstall(cwd, {
        providers: values.providers,
        scope: values.scope,
        project: values.project,
        global: values.global,
        user: values.user,
        yes: values.yes,
        force: values.force
      })
    case 'update':
      return runUpdate(cwd, {
        providers: values.providers,
        scope: values.scope,
        project: values.project,
        global: values.global,
        user: values.user,
        force: values.force
      })
    case 'validate':
      return runValidate(cwd, Boolean(values.json))
    case 'export':
      return runExport(cwd)
    case 'contribute':
      return runContribute(cwd, { slug: values.slug, yes: values.yes })
    case 'pull':
      return runPull(cwd, rest[0]!, {
        catalog: values.catalog,
        force: values.force
      })
    case 'open':
      return runOpen(cwd, rest[0]!, values.force)
    default:
      console.error(`Unknown command "${command}".\n`)
      console.log(HELP)
      return 2
  }
}

main().then((code) => {
  process.exitCode = code
}, (error) => {
  console.error((error as Error).message)
  process.exitCode = 1
})
