import { execFileSync, spawnSync } from 'node:child_process'
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const LINT_RUNNERS = [
  {
    name: 'map',
    file: join(__dirname, '..', 'skills', 'pdd-map', 'scripts', 'run-pdd-kit.mjs')
  },
  {
    name: 'ideate',
    file: join(__dirname, '..', 'skills', 'pdd-ideate', 'scripts', 'run-pdd-kit.mjs')
  },
  {
    name: 'verify',
    file: join(__dirname, '..', 'skills', 'pdd-verify', 'scripts', 'run-pdd-kit.mjs')
  },
]
const temporaryDirectories: string[] = []

function temporary(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe.skipIf(process.platform === 'win32')('isolated skill runners', () => {
  it.each(LINT_RUNNERS)('$name runs npm outside the target and scrubs the key during lint', ({ file }) => {
    const repo = temporary('pdd-kit-runner-repo-')
    const bin = temporary('pdd-kit-runner-bin-')
    const capture = join(temporary('pdd-kit-runner-capture-'), 'npm.json')
    const fakeNpm = join(bin, 'npm')

    execFileSync('git', ['init', '--initial-branch=main'], { cwd: repo, stdio: 'pipe' })
    mkdirSync(join(repo, 'node_modules', '.bin'), { recursive: true })
    writeFileSync(
      join(repo, '.npmrc'),
      'registry=https://attacker.invalid/\n'
    )
    writeFileSync(
      fakeNpm,
      `#!/usr/bin/env node
const fs = require('node:fs')
fs.writeFileSync(process.env.CAPTURE_FILE, JSON.stringify({
  cwd: process.cwd(),
  args: process.argv.slice(2),
  apiKey: process.env.PDD_KIT_API_KEY || null
}))
`
    )
    chmodSync(fakeNpm, 0o755)

    execFileSync(
      process.execPath,
      [file, '--root', repo, 'lint', '--json'],
      {
        env: {
          ...process.env,
          PATH: `${bin}${delimiter}${process.env.PATH || ''}`,
          PDD_KIT_DEV_BIN_DIR: temporary('pdd-kit-runner-no-dev-bin-'),
          CAPTURE_FILE: capture,
          PDD_KIT_API_KEY: 'must-not-reach-lint'
        },
        stdio: 'pipe'
      }
    )

    const recorded = JSON.parse(readFileSync(capture, 'utf8'))
    expect(recorded.cwd).not.toBe(repo)
    expect(recorded.cwd).toContain('pdd-kit-cli-')
    expect(recorded.args).toEqual([
      'exec',
      '--yes',
      '--ignore-scripts',
      '--package=@itai-gendler/pdd-kit@latest',
      '--',
      'pdd-kit',
      '--cwd',
      realpathSync(repo),
      'lint',
      '--json'
    ])
    expect(recorded.apiKey).toBeNull()
  })

  it.each(LINT_RUNNERS)('$name pins the CLI to the version the skills were installed from', ({ name, file }) => {
    // `@itai-gendler/pdd-kit@latest` would lint a model against whatever is published
    // rather than against the release these skills shipped with, reporting the
    // current format's frontmatter keys as unknown.
    const skills = temporary('pdd-kit-runner-pinned-skills-')
    const repo = temporary('pdd-kit-runner-pinned-repo-')
    const bin = temporary('pdd-kit-runner-pinned-bin-')
    const capture = join(temporary('pdd-kit-runner-pinned-capture-'), 'npm.json')

    execFileSync('git', ['init', '--initial-branch=main'], { cwd: repo, stdio: 'pipe' })
    writeFileSync(
      join(skills, '.pdd-kit-install.json'),
      JSON.stringify({ schema: 1, package: '@itai-gendler/pdd-kit', version: '9.9.9' })
    )
    const runnerDir = join(skills, `pdd-kit-${name}`, 'scripts')
    mkdirSync(runnerDir, { recursive: true })
    writeFileSync(
      join(runnerDir, 'run-pdd-kit.mjs'),
      readFileSync(file, 'utf8')
    )

    const fakeNpm = join(bin, 'npm')
    writeFileSync(
      fakeNpm,
      `#!/usr/bin/env node
require('node:fs').writeFileSync(process.env.CAPTURE_FILE, JSON.stringify({
  args: process.argv.slice(2)
}))
`
    )
    chmodSync(fakeNpm, 0o755)

    execFileSync(
      process.execPath,
      [join(runnerDir, 'run-pdd-kit.mjs'), '--root', repo, 'lint'],
      {
        env: {
          ...process.env,
          PATH: `${bin}${delimiter}${process.env.PATH || ''}`,
          PDD_KIT_DEV_BIN_DIR: temporary('pdd-kit-runner-pinned-no-dev-bin-'),
          CAPTURE_FILE: capture
        },
        stdio: 'pipe'
      }
    )

    const recorded = JSON.parse(readFileSync(capture, 'utf8'))
    expect(recorded.args).toContain('--package=@itai-gendler/pdd-kit@9.9.9')
  })

  it.each(LINT_RUNNERS)('$name prefers the explicitly active local development CLI', ({ file }) => {
    const repo = temporary('pdd-kit-runner-dev-repo-')
    const developmentRoot = temporary('pdd-kit-runner-dev-pdd-')
    const bin = temporary('pdd-kit-runner-dev-bin-')
    const capture = join(temporary('pdd-kit-runner-dev-capture-'), 'cli.json')
    const cli = join(developmentRoot, 'dist', 'cli.js')

    execFileSync('git', ['init', '--initial-branch=main'], { cwd: repo, stdio: 'pipe' })
    mkdirSync(join(developmentRoot, 'dist'), { recursive: true })
    writeFileSync(join(developmentRoot, 'package.json'), JSON.stringify({ name: '@itai-gendler/pdd-kit' }))
    writeFileSync(
      cli,
      `require('node:fs').writeFileSync(process.env.CAPTURE_FILE, JSON.stringify({
  cwd: process.cwd(),
  args: process.argv.slice(2),
  apiKey: process.env.PDD_KIT_API_KEY || null
}))\n`
    )
    writeFileSync(
      join(bin, 'pdd-kit-dev'),
      `#!/usr/bin/env node
if (process.argv[2] !== '--dev-cli') process.exit(2)
console.log(${JSON.stringify(cli)})
`
    )
    chmodSync(join(bin, 'pdd-kit-dev'), 0o755)

    execFileSync(process.execPath, [file, '--root', repo, 'lint', '--json'], {
      env: {
        ...process.env,
        PDD_KIT_DEV_BIN_DIR: bin,
        PDD_KIT_API_KEY: 'must-not-reach-lint',
        CAPTURE_FILE: capture
      },
      stdio: 'pipe'
    })

    const recorded = JSON.parse(readFileSync(capture, 'utf8'))
    expect(recorded.cwd).not.toBe(repo)
    expect(recorded.cwd).toContain('pdd-kit-cli-')
    expect(recorded.args).toEqual(['--cwd', realpathSync(repo), 'lint', '--json'])
    expect(recorded.apiKey).toBeNull()
  })
  it.each(LINT_RUNNERS)('$name rejects removed accounting commands', ({ file }) => {
    const repo = temporary('pdd-kit-runner-repo-')
    const result = spawnSync(process.execPath, [file, '--root', repo, 'coverage', 'start'], { encoding: 'utf8' })
    expect(result.status).toBe(2)
    expect(result.stderr).toContain('supports only lint')
  })
})
