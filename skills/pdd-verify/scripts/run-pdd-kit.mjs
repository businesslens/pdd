#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'

/** The npm package that installs the `pdd-kit` command. */
const PACKAGE = '@itai-gendler/pdd-kit'

/**
 * Pin the CLI to the version these skills were installed from.
 *
 * `@itai-gendler/pdd-kit@latest` is wrong here: the skills and the CLI are one release,
 * and a skill installed from version X must lint with version X. Resolving
 * `latest` at run time means a model authored against a newer format gets
 * linted by an older published CLI, which reports the new frontmatter keys as
 * unknown — a confusing failure with no obvious cause.
 */
function installedPackageSpec() {
  try {
    const manifestFile = new URL('../../.pdd-kit-install.json', import.meta.url)
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
    if (manifest?.package === PACKAGE && typeof manifest.version === 'string') {
      return `${PACKAGE}@${manifest.version}`
    }
  } catch {
    // Not installed through `pdd-kit install`; fall back below.
  }
  return `${PACKAGE}@latest`
}

/**
 * Maintainers can explicitly activate one local PDD worktree through
 * `~/.local/bin/bl`. Resolve only that fixed development command, outside the
 * untrusted target repository; ordinary installations retain the pinned npm
 * fallback above.
 */
function activeDevelopmentCli(runnerRoot, env) {
  const binDirectory = resolve(env.PDD_KIT_DEV_BIN_DIR || join(homedir(), '.local', 'bin'))
  try {
    const cli = execFileSync(join(binDirectory, 'bl'), ['--dev-cli'], {
      cwd: runnerRoot,
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
    if (!isAbsolute(cli) || !statSync(cli).isFile()) return undefined
    const packageRoot = dirname(dirname(cli))
    const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
    return manifest?.name === PACKAGE ? cli : undefined
  } catch {
    return undefined
  }
}

function fail(message) {
  process.stderr.write(`${message}\n`)
  process.exit(2)
}

const args = process.argv.slice(2)
const rootIndex = args.indexOf('--root')
const requestedRoot = rootIndex >= 0 ? args[rootIndex + 1] : undefined
if (!requestedRoot) {
  fail('Usage: run-pdd-kit.mjs --root <repository> lint [--json]')
}

const commandArgs = args.filter(
  (_, index) => index !== rootIndex && index !== rootIndex + 1
)
if (commandArgs[0] !== 'lint') {
  fail('The isolated pdd-kit runner supports only lint.')
}

let root
try {
  root = resolve(execFileSync(
    'git',
    ['-C', resolve(requestedRoot), 'rev-parse', '--show-toplevel'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  ).trim())
} catch {
  fail('The pdd-kit runner must target a Git repository.')
}

const runnerRoot = mkdtempSync(join(tmpdir(), 'pdd-kit-cli-'))
const env = { ...process.env }
delete env.PDD_KIT_API_KEY

try {
  const developmentCli = activeDevelopmentCli(runnerRoot, env)
  if (developmentCli) {
    execFileSync(process.execPath, [developmentCli, '--cwd', root, ...commandArgs], {
      cwd: runnerRoot,
      env,
      stdio: 'inherit'
    })
  } else {
    execFileSync(
      'npm',
      [
        'exec',
        '--yes',
        '--ignore-scripts',
        `--package=${installedPackageSpec()}`,
        '--',
        'pdd-kit',
        '--cwd',
        root,
        ...commandArgs
      ],
      {
        cwd: runnerRoot,
        env,
        stdio: 'inherit'
      }
    )
  }
} catch (error) {
  process.exitCode = typeof error.status === 'number' ? error.status : 1
} finally {
  rmSync(runnerRoot, { recursive: true, force: true })
}
