#!/usr/bin/env node
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { runBuild } from './commands/build.js'
import { runInstall } from './commands/install.js'
import { runLogin } from './commands/login.js'
import { runOpen } from './commands/open.js'
import { runPublish } from './commands/publish.js'
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
  build                       Compile .businesslens/ into .businesslens/build/report.json
  publish [--yes]             Report an immutable Product Model Version to the Platform
  login                       Authorize CLI access through the Platform browser flow
  pull <blueprint>            Pull the latest or an exact Blueprint version
  open <report> [--force]     Expand a local Product Report into .businesslens/

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
  --tag <name>                Publish HEAD into the named tag Track
  --pull-request <number>     Publish into a pull-request Track
  --base-branch <name>        Required base branch for --pull-request
  --pr-title <title>          Optional pull-request title
  --pr-url <url>              Optional pull-request URL

Open options:
  --force                     Back up a non-empty .businesslens/ before opening
                              A relative <report> path resolves against the
                              current shell directory, not against --cwd.

Login options:
  --platform <origin>         Official Platform or loopback development origin

Pull options:
  --version <number>          Pull an exact version instead of latest
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

function normalizedArgs(args: string[]): string[] {
  const commandIndex = args.indexOf('pull')
  if (commandIndex < 0) return args
  return args.map((argument, index) => {
    if (index <= commandIndex) return argument
    if (argument === '--version') return '--blueprint-version'
    if (argument.startsWith('--version=')) {
      return `--blueprint-version=${argument.slice('--version='.length)}`
    }
    return argument
  })
}

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    args: normalizedArgs(process.argv.slice(2)),
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
      tag: { type: 'string' },
      'pull-request': { type: 'string' },
      'base-branch': { type: 'string' },
      'pr-title': { type: 'string' },
      'pr-url': { type: 'string' },
      platform: { type: 'string' },
      'blueprint-version': { type: 'string' },
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
    case 'build':
      return runBuild(cwd)
    case 'publish':
      return runPublish(cwd, {
        yes: values.yes,
        tag: values.tag,
        pullRequest: values['pull-request'] === undefined ? undefined : Number(values['pull-request']),
        baseBranch: values['base-branch'],
        prTitle: values['pr-title'],
        prUrl: values['pr-url']
      })
    case 'login':
      return runLogin({ platform: values.platform })
    case 'pull':
      return runPull(cwd, positionals[1]!, {
        version: values['blueprint-version'] === undefined
          ? undefined
          : Number(values['blueprint-version']),
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
