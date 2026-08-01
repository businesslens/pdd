import { execFileSync, execSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..')
const CLI = join(ROOT, 'dist', 'cli.js')
const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')

interface CliResult {
  status: number
  stdout: string
  stderr: string
}

function cli(cwd: string, env: NodeJS.ProcessEnv, ...args: string[]): CliResult {
  // spawnSync rather than execFileSync so stderr is captured on success too —
  // a command that warns while succeeding is exactly what the deprecated
  // `build` alias does.
  const result = spawnSync('node', [CLI, ...args], { cwd, env, encoding: 'utf8' })
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? ''
  }
}

function sh(cwd: string, command: string, ...args: string[]): void {
  execFileSync(command, args, { cwd, stdio: 'pipe' })
}

let repo: string

beforeAll(() => {
  // dist/ is built once in test/global-setup.ts. Building here raced with the
  // other suites that spawn from it.
  repo = mkdtempSync(join(tmpdir(), 'bl-cli-'))
  cpSync(FIXTURE, repo, { recursive: true })
  sh(repo, 'git', 'init', '--initial-branch=main')
  sh(repo, 'git', 'config', 'user.email', 'fixture@example.com')
  sh(repo, 'git', 'config', 'user.name', 'Fixture')
  sh(repo, 'git', 'remote', 'add', 'origin', 'https://github.com/example/fixture-shop.git')
  sh(repo, 'git', 'add', '.')
  sh(repo, 'git', 'commit', '-m', 'fixture')
})

afterAll(() => {
  rmSync(repo, { recursive: true, force: true })
})

describe('cli dispatch', () => {
  it('lists the catalog commands in help and no retired ones', () => {
    const result = cli(repo, process.env, 'validate', '--help')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('blueprint export')
    expect(result.stdout).toContain('blueprint open <report>')
    expect(result.stdout).toContain('blueprint pull <name>')
    expect(result.stdout).toContain('blueprint contribute [--yes]')
    expect(result.stdout).toContain('--catalog <origin>')
    expect(result.stdout).toContain('--cwd <path>')

    // Retired with the Platform.
    expect(result.stdout).not.toContain('login ')
    expect(result.stdout).not.toContain('--tag <name>')
    expect(result.stdout).not.toContain('--pull-request <number>')
  })

  it('exports the selected repository into report.json', () => {
    const result = cli(ROOT, process.env, '--cwd', repo, 'blueprint', 'export')
    expect(result.status).toBe(0)
    expect(existsSync(join(repo, '.businesslens', 'build', 'report.json'))).toBe(true)
  })

  it('keeps the bare catalog spellings working, with a deprecation warning', () => {
    // `Not_Canonical` is neither a readable report path nor a valid Blueprint
    // name, so each command fails locally — the warning is what is under test,
    // and nothing here should reach the network or the GitHub CLI.
    for (const command of ['export', 'open', 'pull', 'contribute']) {
      const result = cli(ROOT, process.env, '--cwd', repo, command, 'Not_Canonical')
      expect(result.stderr, command).toContain(
        `\`businesslens ${command}\` is deprecated; use \`businesslens blueprint ${command}\`.`
      )
    }
    // …and the deprecated spelling still does the work, not just warn.
    rmSync(join(repo, '.businesslens', 'build'), { recursive: true, force: true })
    expect(cli(ROOT, process.env, '--cwd', repo, 'export').status).toBe(0)
    expect(existsSync(join(repo, '.businesslens', 'build', 'report.json'))).toBe(true)
  })

  it('rejects a blueprint invocation with no or an unknown subcommand', () => {
    const bare = cli(ROOT, process.env, '--cwd', repo, 'blueprint')
    expect(bare.status).toBe(2)
    expect(bare.stderr).toContain('blueprint requires a subcommand')

    const unknown = cli(ROOT, process.env, '--cwd', repo, 'blueprint', 'frobnicate')
    expect(unknown.status).toBe(2)
    expect(unknown.stderr).toContain('Unknown blueprint command "frobnicate"')
  })

  it('keeps `build` working as a deprecated alias that warns', () => {
    // Purely local, and it would otherwise survive this release untouched, so
    // renaming it outright would break CI scripts nothing else here affects.
    rmSync(join(repo, '.businesslens', 'build'), { recursive: true, force: true })
    const result = cli(ROOT, process.env, '--cwd', repo, 'build')
    expect(result.status).toBe(0)
    expect(result.stderr).toContain('deprecated')
    expect(existsSync(join(repo, '.businesslens', 'build', 'report.json'))).toBe(true)
  })

  it('no longer accepts the retired login command', () => {
    const result = cli(repo, process.env, 'login')
    expect(result.status).toBe(2)
    expect(result.stderr).toContain('Unknown command')
  })

  it('treats --version as the CLI version now that pull has no version flag', () => {
    // `pull --version <n>` used to mean a Blueprint version, which required
    // remapping the flag before parsing. Blueprints have no versions any more.
    const result = cli(repo, process.env, '--version')
    expect(result.status).toBe(0)
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('does not treat option values named pull as the pull command', () => {
    const cwdResult = cli(ROOT, process.env, '--cwd', 'pull', '--version')
    expect(cwdResult.status).toBe(0)
    expect(cwdResult.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)

    const catalogResult = cli(repo, process.env, '--catalog', 'pull', '--version')
    expect(catalogResult.status).toBe(0)
    expect(catalogResult.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('rejects unknown commands with usage exit code', () => {
    const result = cli(repo, process.env, 'bogus')
    expect(result.status).toBe(2)
    expect(result.stderr).toContain('Unknown command "bogus"')
  })
})
