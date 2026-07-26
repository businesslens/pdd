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

const RUNNER = join(__dirname, '..', 'skills', 'businesslens-publish', 'scripts', 'run-businesslens.mjs')
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

describe.skipIf(process.platform === 'win32')('isolated publish-skill runner', () => {
  it('runs npm outside the target and scrubs the key during validation', () => {
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
      [RUNNER, '--root', repo, 'validate', '--json'],
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

  it('passes the key only to the isolated publish invocation', () => {
    const repo = temporary('bl-runner-publish-repo-')
    const bin = temporary('bl-runner-publish-bin-')
    const capture = join(temporary('bl-runner-publish-capture-'), 'npm.json')
    const fakeNpm = join(bin, 'npm')

    execFileSync('git', ['init', '--initial-branch=main'], { cwd: repo, stdio: 'pipe' })
    writeFileSync(
      fakeNpm,
      `#!/usr/bin/env node
require('node:fs').writeFileSync(process.env.CAPTURE_FILE, JSON.stringify({
  cwd: process.cwd(),
  args: process.argv.slice(2),
  apiKey: process.env.BUSINESSLENS_API_KEY || null
}))
`
    )
    chmodSync(fakeNpm, 0o755)

    execFileSync(
      process.execPath,
      [RUNNER, '--root', repo, 'publish', '--yes'],
      {
        env: {
          ...process.env,
          PATH: `${bin}${delimiter}${process.env.PATH || ''}`,
          CAPTURE_FILE: capture,
          BUSINESSLENS_API_KEY: 'publish-test-key'
        },
        stdio: 'pipe'
      }
    )

    const recorded = JSON.parse(readFileSync(capture, 'utf8'))
    expect(recorded.cwd).not.toBe(repo)
    expect(recorded.args.slice(-2)).toEqual(['publish', '--yes'])
    expect(recorded.apiKey).toBe('publish-test-key')
  })
})
