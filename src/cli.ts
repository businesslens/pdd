#!/usr/bin/env node
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { runBuild } from './commands/build.js'
import { runInstall } from './commands/install.js'
import { runPublish } from './commands/publish.js'
import { runUpdate } from './commands/update.js'
import { runValidate } from './commands/validate.js'
import { cliVersion } from './version.js'

const HELP = `businesslens — Product-Driven Design for coding agents

Usage: businesslens <command> [options]

Commands:
  install                     Install BusinessLens skills for detected AI harnesses
  update                      Refresh managed BusinessLens skill installations
  validate [--json]           Validate the .businesslens/ product map
  build                       Compile .businesslens/ into .businesslens/build/project.json
  publish [--yes]             Build and submit the map to the BusinessLens platform

Install options:
  --providers <list>          Comma-separated: claude,codex,cursor,gemini,github
  --scope <scope>             project or global
  --project                   Shortcut for --scope project
  --global, --user            Shortcut for --scope global
  --yes                       Accept detected providers and project scope
  --force                     Replace an unmarked businesslens-* skill directory

Publish options:
  --yes                       Skip the confirmation prompt (required in
                              non-interactive sessions). Publishing reads the
                              workspace API key from BUSINESSLENS_API_KEY.

General options:
  --cwd <path>                Run against this repository instead of the current directory
  --help                      Show this help
  --version                   Show the CLI version

Agent workflows:
  /businesslens-init          Build the initial product map
  /businesslens-sync          Refresh the map after behavior changes
  /businesslens-deep-dive     Expand one journey or experience
  /businesslens-validate      Validate the map and explain every result
  /businesslens-doctor        Diagnose validation, drift, and coverage
  /businesslens-publish       Publish the map to the BusinessLens platform

Exit codes: 0 success · 1 failure · 2 usage error`

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
  if (positionals.length > 1) {
    console.error(`Unexpected argument "${positionals[1]}".`)
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
    case 'build':
      return runBuild(cwd)
    case 'publish':
      return runPublish(cwd, values.yes)
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
