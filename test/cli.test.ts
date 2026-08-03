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
    const result = cli(repo, process.env, 'lint', '--help')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('blueprint export')
    expect(result.stdout).toContain('blueprint open <report>')
    expect(result.stdout).toContain('blueprint pull <name>')
    expect(result.stdout).toContain('blueprint contribute [--yes]')
    expect(result.stdout).toContain('--catalog <origin>')
    expect(result.stdout).toContain('--cwd <path>')
    expect(result.stdout).toContain('businesslens-map')
    expect(result.stdout).toContain('businesslens-verify')
    expect(result.stdout).not.toContain('businesslens-sync')

    // Retired with the Platform.
    expect(result.stdout).not.toContain('login ')
    expect(result.stdout).not.toContain('--tag <name>')
    expect(result.stdout).not.toContain('--pull-request <number>')
  })

  it('lints structure without emitting branch authority', () => {
    const result = cli(ROOT, process.env, '--cwd', repo, 'lint', '--json')
    expect(result.status).toBe(0)
    const output = JSON.parse(result.stdout)
    expect(output).toMatchObject({ ok: true, errors: [], warnings: [] })
    expect(output.branch).toBeUndefined()
  })

  it('refuses validate and names lint as the replacement', () => {
    const result = cli(ROOT, process.env, '--cwd', repo, 'validate')
    expect(result.status).toBe(2)
    expect(result.stderr).toContain('Use `businesslens lint`')
  })

  it('exports the selected repository into report.json', () => {
    const result = cli(ROOT, process.env, '--cwd', repo, 'blueprint', 'export')
    expect(result.status).toBe(0)
    expect(existsSync(join(repo, '.businesslens', 'build', 'report.json'))).toBe(true)
  })

  it('refuses the bare catalog spellings and names the replacement', () => {
    // Removed rather than aliased. Keeping `export` would have blocked reusing
    // that name for a source-linked report profile later, and reusing it while an
    // alias existed would silently change a disclosure-relevant default.
    for (const command of ['export', 'open', 'pull', 'contribute']) {
      const result = cli(ROOT, process.env, '--cwd', repo, command)
      expect(result.status, command).toBe(2)
      expect(result.stderr, command).toContain(
        `\`businesslens ${command}\` has moved. Use \`businesslens blueprint ${command}\`.`
      )
    }
    // Nothing ran: no report was produced by the refused invocation.
    rmSync(join(repo, '.businesslens', 'build'), { recursive: true, force: true })
    expect(cli(ROOT, process.env, '--cwd', repo, 'export').status).toBe(2)
    expect(existsSync(join(repo, '.businesslens', 'build', 'report.json'))).toBe(false)
  })

  it('rejects a blueprint invocation with no or an unknown subcommand', () => {
    const bare = cli(ROOT, process.env, '--cwd', repo, 'blueprint')
    expect(bare.status).toBe(2)
    expect(bare.stderr).toContain('blueprint requires a subcommand')

    const unknown = cli(ROOT, process.env, '--cwd', repo, 'blueprint', 'frobnicate')
    expect(unknown.status).toBe(2)
    expect(unknown.stderr).toContain('Unknown blueprint command "frobnicate"')
  })

  it('uses the usage exit code for invalid options, providers, and scopes', () => {
    const unknownOption = cli(repo, process.env, 'lint', '--frobnicate')
    expect(unknownOption.status).toBe(2)

    const unknownProvider = cli(
      repo, process.env, 'install', '--providers', 'frobnicate', '--scope', 'project', '--yes'
    )
    expect(unknownProvider.status).toBe(2)
    expect(unknownProvider.stderr).toContain('Unknown provider')

    const invalidScope = cli(
      repo, process.env, 'install', '--providers', 'codex', '--scope', 'workspace', '--yes'
    )
    expect(invalidScope.status).toBe(2)
    expect(invalidScope.stderr).toContain('--scope must be project or global')
  })

  it('retires `build` and points at what replaced it', () => {
    // `build` now means writing the software a model describes, which this
    // project deliberately leaves to whatever tool you already use.
    rmSync(join(repo, '.businesslens', 'build'), { recursive: true, force: true })
    const result = cli(ROOT, process.env, '--cwd', repo, 'build')
    expect(result.status).toBe(2)
    expect(result.stderr).toContain('Use `businesslens blueprint export`')
    expect(existsSync(join(repo, '.businesslens', 'build', 'report.json'))).toBe(false)
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
