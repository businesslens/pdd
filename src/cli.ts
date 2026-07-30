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
  export                      Compile .businesslens/ into .businesslens/build/report.json
  contribute [--yes]          Open a pull request adding this model to the Blueprint catalog
  pull <blueprint>            Pull a Blueprint from the catalog
  open <report> [--force]     Expand a local Product Report into .businesslens/

Install options:
  --providers <list>          Comma-separated: claude,codex,cursor,gemini,github
  --scope <scope>             project or global
  --project                   Shortcut for --scope project
  --global, --user            Shortcut for --scope global
  --yes                       Accept detected providers and project scope
  --force                     Replace an unmarked businesslens-* skill directory

Contribute options:
  --slug <name>               Catalog slug (defaults to the product id)
  --yes                       Skip the confirmation prompt (required in
                              non-interactive sessions). Requires an
                              authenticated GitHub CLI.

Open options:
  --force                     Back up a non-empty .businesslens/ before opening
                              A relative <report> path resolves against the
                              current shell directory, not against --cwd.

Pull options:
  --catalog <origin>          Catalog origin to pull from (default https://businesslens.io)
  --force                     Back up a non-empty .businesslens/ before pulling

General options:
  --cwd <path>                Run against this repository instead of the current directory
  --help                      Show this help
  --version                   Show the CLI version

Agent workflows:
  /businesslens-init          Build the initial product model from existing code
  /businesslens-plan          Plan a product or feature in the product model
  /businesslens-verify        Verify implementation against the planned model
  /businesslens-sync          Repair the model after unplanned code changes
  /businesslens-deep-dive     Expand one journey or experience
  /businesslens-validate      Validate the model and explain every result
  /businesslens-doctor        Diagnose validation, drift, and coverage
  /businesslens-publish       Report the model to the BusinessLens Platform

Exit codes: 0 success · 1 failure · 2 usage error`

const STRING_OPTIONS = new Set([
  'providers',
  'scope',
  'catalog',
  'slug',
  'cwd'
])

function commandArgumentIndex(args: string[]): number {
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!
    if (argument === '--') return -1
    if (!argument.startsWith('--')) return index

    const equals = argument.indexOf('=')
    const name = argument.slice(2, equals < 0 ? undefined : equals)
    if (equals < 0 && STRING_OPTIONS.has(name)) index += 1
  }
  return -1
}

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
  const command = positionals[0]
  if (values.help || !command) {
    console.log(HELP)
    return command ? 0 : 2
  }
  if (command !== 'open' && command !== 'pull' && positionals.length > 1) {
    console.error(`Unexpected argument "${positionals[1]}".`)
    return 2
  }
  if (command === 'open' && positionals.length !== 2) {
    console.error('open requires one local Product Report path.')
    return 2
  }
  if (command === 'pull' && positionals.length !== 2) {
    console.error('pull requires one canonical Blueprint name.')
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
    case 'build':
      // Deprecated alias kept through 0.7.x. `build` is purely local, so
      // renaming it would break CI scripts that nothing else in this release
      // touches.
      console.warn('`businesslens build` is deprecated; use `businesslens export`.')
      return runExport(cwd)
    case 'contribute':
      return runContribute(cwd, { slug: values.slug, yes: values.yes })
    case 'pull':
      return runPull(cwd, positionals[1]!, {
        catalog: values.catalog,
        force: values.force
      })
    case 'open':
      return runOpen(cwd, positionals[1]!, values.force)
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
