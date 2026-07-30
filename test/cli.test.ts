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
  execSync('npm run build', { cwd: ROOT, stdio: 'pipe' })
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
    expect(result.stdout).toContain('export ')
    expect(result.stdout).toContain('contribute [--yes]')
    expect(result.stdout).toContain('pull <blueprint>')
    expect(result.stdout).toContain('--catalog <origin>')
    expect(result.stdout).toContain('--cwd <path>')

    // Retired with the Platform.
    expect(result.stdout).not.toContain('login ')
    expect(result.stdout).not.toContain('--tag <name>')
    expect(result.stdout).not.toContain('--pull-request <number>')
  })

  it('exports the selected repository into report.json', () => {
    const result = cli(ROOT, process.env, '--cwd', repo, 'export')
    expect(result.status).toBe(0)
    expect(existsSync(join(repo, '.businesslens', 'build', 'report.json'))).toBe(true)
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
