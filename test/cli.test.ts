import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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

describe('cli help', () => {
  it('shows concise root help for no arguments, --help, and -h', () => {
    for (const args of [[], ['--help'], ['-h']]) {
      const result = cli(repo, process.env, ...args)
      expect(result.status, args.join(' ')).toBe(0)
      expect(result.stderr).toBe('')
      expect(result.stdout).toContain('Usage: businesslens <command> [options]')
      expect(result.stdout).toContain('install [options]')
      expect(result.stdout).toContain('update [options]')
      expect(result.stdout).toContain('lint [options]')
      expect(result.stdout).toContain('view [options]')
      expect(result.stdout).toContain('blueprint')
      expect(result.stdout).toContain('-c, --cwd <path>')
      expect(result.stdout).not.toContain('-C <path>')
      expect(result.stdout).toContain('-V, --version')
      expect(result.stdout.indexOf('Commands:')).toBeLessThan(result.stdout.indexOf('Options:'))

      expect(result.stdout).not.toContain('--providers')
      expect(result.stdout).not.toContain('--catalog')
      expect(result.stdout).not.toContain('--no-open')
      expect(result.stdout).not.toContain('Model selection')
      expect(result.stdout).not.toContain('Agent workflows')
      expect(result.stdout).not.toContain('businesslens-map')
    }
  })

  it('shows only view options in view help', () => {
    const result = cli(repo, process.env, 'view', '--help')
    expect(result.status).toBe(0)
    expect(result.stderr).toBe('')
    expect(result.stdout).toContain('Usage: businesslens view [options]')
    expect(result.stdout).toContain('--no-open')
    expect(result.stdout).toContain('--port <port>')
    expect(result.stdout).toContain('--cwd <path>')
    expect(result.stdout).not.toContain('--providers')
    expect(result.stdout).not.toContain('--catalog')
    expect(result.stdout).not.toContain('Agent workflows')
  })

  it('shows Blueprint subcommands separately from pull options', () => {
    const group = cli(repo, process.env, 'blueprint', '--help')
    expect(group.status).toBe(0)
    expect(group.stdout).toContain('Usage: businesslens blueprint <command> [options]')
    expect(group.stdout).toContain('export')
    expect(group.stdout).toContain('open [options] <report>')
    expect(group.stdout).toContain('pull [options] <name>')
    expect(group.stdout).toContain('contribute [options]')
    expect(group.stdout).not.toContain('--catalog')
    expect(group.stdout).not.toContain('--force')

    const pull = cli(repo, process.env, 'blueprint', 'pull', '--help')
    expect(pull.status).toBe(0)
    expect(pull.stdout).toContain('Usage: businesslens blueprint pull [options] <name>')
    expect(pull.stdout).toContain('--catalog <origin>')
    expect(pull.stdout).toContain('--force')
    expect(pull.stdout).not.toContain('--no-open')
    expect(pull.stdout).not.toContain('--providers')
  })

  it('keeps legacy scope shortcuts out of install help', () => {
    const result = cli(repo, process.env, 'install', '--help')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('--scope <scope>')
    expect(result.stdout).not.toContain('--project')
    expect(result.stdout).not.toContain('--global')
    expect(result.stdout).not.toContain('--user')
  })

  it('supports the standard short version option', () => {
    const result = cli(repo, process.env, '-V')
    expect(result.status).toBe(0)
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)
  })
})

describe('cli dispatch', () => {
  it('lints structure without emitting branch authority', () => {
    const result = cli(ROOT, process.env, '--cwd', repo, 'lint', '--json')
    expect(result.status).toBe(0)
    const output = JSON.parse(result.stdout)
    expect(output).toMatchObject({ ok: true, errors: [], warnings: [] })
    expect(output.branch).toBeUndefined()
  })

  it('accepts --cwd and -c before or after a command, plus legacy -C', () => {
    for (const args of [
      ['--cwd', repo, 'lint', '--json'],
      ['lint', '--cwd', repo, '--json'],
      ['-c', repo, 'lint', '--json'],
      ['lint', '-c', repo, '--json'],
      ['-C', repo, 'lint', '--json']
    ]) {
      const result = cli(ROOT, process.env, ...args)
      expect(result.status, args.join(' ')).toBe(0)
      expect(JSON.parse(result.stdout)).toMatchObject({ ok: true, errors: [] })
    }
  })

  it('treats the current directory and an explicit --cwd . identically', () => {
    const nested = mkdtempSync(join(repo, 'nested-product-'))
    try {
      cpSync(join(FIXTURE, '.businesslens'), join(nested, '.businesslens'), { recursive: true })
      writeFileSync(join(nested, '.businesslens', 'config.yaml'), 'schema: 99\nsdd:\n  paths: []\n')

      for (const args of [['lint', '--json'], ['--cwd', '.', 'lint', '--json']]) {
        const result = cli(nested, process.env, ...args)
        expect(result.status, args.join(' ')).toBe(1)
        expect(JSON.parse(result.stdout).errors).toContain(
          'config.yaml: schema 99 is not supported (expected 4)'
        )
      }
    } finally {
      rmSync(nested, { recursive: true, force: true })
    }
  })

  it('exports the selected repository into report.json', () => {
    const result = cli(ROOT, process.env, '--cwd', repo, 'blueprint', 'export')
    expect(result.status).toBe(0)
    expect(existsSync(join(repo, '.businesslens', 'build', 'report.json'))).toBe(true)
  })

  it('refuses retired command spellings and names their replacements', () => {
    for (const command of ['export', 'open', 'pull', 'contribute']) {
      const result = cli(ROOT, process.env, '--cwd', repo, command)
      expect(result.status, command).toBe(2)
      expect(result.stderr, command).toContain(
        `\`businesslens ${command}\` has moved. Use \`businesslens blueprint ${command}\`.`
      )
    }

    const build = cli(ROOT, process.env, '--cwd', repo, 'build')
    expect(build.status).toBe(2)
    expect(build.stderr).toContain('Use `businesslens blueprint export`')

    const validate = cli(ROOT, process.env, '--cwd', repo, 'validate')
    expect(validate.status).toBe(2)
    expect(validate.stderr).toContain('Use `businesslens lint`')
  })

  it('shows Blueprint help without running anything when the group is bare', () => {
    const result = cli(ROOT, process.env, '--cwd', repo, 'blueprint')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Usage: businesslens blueprint <command> [options]')
  })

  it('rejects unknown root and Blueprint commands with usage exit code', () => {
    const root = cli(repo, process.env, 'bogus')
    expect(root.status).toBe(2)
    expect(root.stderr).toContain("unknown command 'bogus'")

    const blueprint = cli(repo, process.env, 'blueprint', 'frobnicate')
    expect(blueprint.status).toBe(2)
    expect(blueprint.stderr).toContain("unknown command 'frobnicate'")
  })

  it('rejects options that do not belong to the selected command', () => {
    const cases = [
      ['lint', '--force'],
      ['lint', '--no-open'],
      ['view', '--providers', 'codex'],
      ['blueprint', 'export', '--force'],
      ['blueprint', 'contribute', '--catalog', 'https://example.com'],
      ['blueprint', 'contribute', '--slug', 'other-name']
    ]
    for (const args of cases) {
      const result = cli(repo, process.env, ...args)
      expect(result.status, args.join(' ')).toBe(2)
      expect(result.stderr, args.join(' ')).toContain('unknown option')
    }
  })

  it('uses the usage exit code for invalid providers and scopes', () => {
    const unknownProvider = cli(
      repo, process.env, 'install', '--providers', 'frobnicate', '--scope', 'project', '--yes'
    )
    expect(unknownProvider.status).toBe(2)
    expect(unknownProvider.stderr).toContain('Unknown provider')

    const invalidScope = cli(
      repo, process.env, 'install', '--providers', 'codex', '--scope', 'workspace', '--yes'
    )
    expect(invalidScope.status).toBe(2)
    expect(invalidScope.stderr).toContain('expected "project" or "global"')
  })

  it('rejects invalid viewer ports as usage errors before loading the model', () => {
    const empty = mkdtempSync(join(tmpdir(), 'bl-view-port-'))
    try {
      for (const value of ['0', '65536', '1.5', 'nope']) {
        const result = cli(empty, process.env, 'view', '--no-open', '--port', value)
        expect(result.status, value).toBe(2)
        expect(result.stderr, value).toContain('expected an integer from 1 to 65535')
        expect(result.stderr, value).not.toContain('No .businesslens/')
      }
    } finally {
      rmSync(empty, { recursive: true, force: true })
    }
  })

  it('does not accept retired commands or options as aliases', () => {
    rmSync(join(repo, '.businesslens', 'build'), { recursive: true, force: true })
    expect(cli(ROOT, process.env, '--cwd', repo, 'export').status).toBe(2)
    expect(existsSync(join(repo, '.businesslens', 'build', 'report.json'))).toBe(false)

    const login = cli(repo, process.env, 'login')
    expect(login.status).toBe(2)
    expect(login.stderr).toContain('unknown command')
  })

  it('does not treat option values named pull as commands', () => {
    const cwdResult = cli(ROOT, process.env, '--cwd', 'pull', '--version')
    expect(cwdResult.status).toBe(0)
    expect(cwdResult.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)

    const catalogResult = cli(repo, process.env, 'blueprint', 'pull', '--catalog', 'pull', '--version')
    expect(catalogResult.status).toBe(0)
    expect(catalogResult.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)
  })
})
