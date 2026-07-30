import { execFileSync } from 'node:child_process'
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

const VALIDATE_RUNNERS = [
  {
    name: 'plan',
    file: join(__dirname, '..', 'skills', 'businesslens-plan', 'scripts', 'run-businesslens.mjs')
  },
  {
    name: 'verify',
    file: join(__dirname, '..', 'skills', 'businesslens-verify', 'scripts', 'run-businesslens.mjs')
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
  it.each(VALIDATE_RUNNERS)('$name runs npm outside the target and scrubs the key during validation', ({ file }) => {
    const repo = temporary('bl-runner-repo-')
    const bin = temporary('bl-runner-bin-')
    const capture = join(temporary('bl-runner-capture-'), 'npm.json')
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
  apiKey: process.env.BUSINESSLENS_API_KEY || null
}))
`
    )
    chmodSync(fakeNpm, 0o755)

    execFileSync(
      process.execPath,
      [file, '--root', repo, 'validate', '--json'],
      {
        env: {
          ...process.env,
          PATH: `${bin}${delimiter}${process.env.PATH || ''}`,
          CAPTURE_FILE: capture,
          BUSINESSLENS_API_KEY: 'must-not-reach-validation'
        },
        stdio: 'pipe'
      }
    )

    const recorded = JSON.parse(readFileSync(capture, 'utf8'))
    expect(recorded.cwd).not.toBe(repo)
    expect(recorded.cwd).toContain('businesslens-cli-')
    expect(recorded.args).toEqual([
      'exec',
      '--yes',
      '--ignore-scripts',
      '--package=businesslens@latest',
      '--',
      'businesslens',
      '--cwd',
      realpathSync(repo),
      'validate',
      '--json'
    ])
    expect(recorded.apiKey).toBeNull()
  })

  it('pins the CLI to the version the skills were installed from', () => {
    // `businesslens@latest` would validate a model against whatever is published
    // rather than against the release these skills shipped with, reporting the
    // current format's frontmatter keys as unknown.
    const skills = temporary('bl-runner-pinned-skills-')
    const repo = temporary('bl-runner-pinned-repo-')
    const bin = temporary('bl-runner-pinned-bin-')
    const capture = join(temporary('bl-runner-pinned-capture-'), 'npm.json')

    execFileSync('git', ['init', '--initial-branch=main'], { cwd: repo, stdio: 'pipe' })
    writeFileSync(
      join(skills, '.businesslens-install.json'),
      JSON.stringify({ schema: 1, package: 'businesslens', version: '9.9.9' })
    )
    const runnerDir = join(skills, 'businesslens-plan', 'scripts')
    mkdirSync(runnerDir, { recursive: true })
    writeFileSync(
      join(runnerDir, 'run-businesslens.mjs'),
      readFileSync(VALIDATE_RUNNERS[0]!.file, 'utf8')
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
      [join(runnerDir, 'run-businesslens.mjs'), '--root', repo, 'validate'],
      {
        env: {
          ...process.env,
          PATH: `${bin}${delimiter}${process.env.PATH || ''}`,
          CAPTURE_FILE: capture
        },
        stdio: 'pipe'
      }
    )

    const recorded = JSON.parse(readFileSync(capture, 'utf8'))
    expect(recorded.args).toContain('--package=businesslens@9.9.9')
  })
})
