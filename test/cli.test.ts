import { execFileSync, execSync } from 'node:child_process'
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
  try {
    const stdout = execFileSync('node', [CLI, ...args], { cwd, env, stdio: 'pipe' }).toString()
    return { status: 0, stdout, stderr: '' }
  } catch (error) {
    const failure = error as { status?: number, stdout?: Buffer, stderr?: Buffer }
    return {
      status: failure.status ?? 1,
      stdout: failure.stdout?.toString() ?? '',
      stderr: failure.stderr?.toString() ?? ''
    }
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
  it('lists build, publish, login, pull, and open in help', () => {
    const result = cli(repo, process.env, 'validate', '--help')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('build ')
    expect(result.stdout).toContain('publish [--yes]')
    expect(result.stdout).toContain('--tag <name>')
    expect(result.stdout).toContain('--pull-request <number>')
    expect(result.stdout).toContain('login ')
    expect(result.stdout).toContain('pull <blueprint>')
    expect(result.stdout).toContain('--version <number>')
    expect(result.stdout).toContain('--cwd <path>')
    expect(result.stdout).toContain('/businesslens-publish')
  })

  it('builds the selected repository into report.json', () => {
    const result = cli(ROOT, process.env, '--cwd', repo, 'build')
    expect(result.status).toBe(0)
    expect(existsSync(join(repo, '.businesslens', 'build', 'report.json'))).toBe(true)
  })

  it('refuses to publish without BUSINESSLENS_API_KEY', () => {
    const env = { ...process.env }
    delete env.BUSINESSLENS_API_KEY
    const result = cli(repo, env, 'publish', '--yes')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('BUSINESSLENS_API_KEY is not set')
  })

  it('parses a pull-specific --version without treating it as the CLI version', () => {
    const env = {
      ...process.env,
      BUSINESSLENS_CONFIG_DIR: join(repo, 'empty-cli-config')
    }
    const result = cli(repo, env, 'pull', 'example', '--version', '3')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('businesslens login')
    expect(result.stdout).not.toContain('0.6.0')
  })

  it('rejects unknown commands with usage exit code', () => {
    const result = cli(repo, process.env, 'bogus')
    expect(result.status).toBe(2)
    expect(result.stderr).toContain('Unknown command "bogus"')
  })
})
