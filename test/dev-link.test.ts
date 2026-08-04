import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { activateDevelopmentLink, removeDevelopmentLink } from '../scripts/dev-link.mjs'

const ROOT = join(__dirname, '..')
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

describe.skipIf(process.platform === 'win32')('BusinessLens development link', () => {
  it('activates the current worktree and exposes its root through bl', () => {
    const bin = temporary('bl-dev-bin-')
    const env = { ...process.env, BUSINESSLENS_DEV_BIN_DIR: bin }

    const activated = activateDevelopmentLink(ROOT, env)
    expect(existsSync(activated.link)).toBe(true)
    expect(execFileSync(activated.link, ['--dev-root'], { env, encoding: 'utf8' }).trim()).toBe(ROOT)

    expect(removeDevelopmentLink(ROOT, env)).toMatchObject({ removed: true })
    expect(existsSync(activated.link)).toBe(false)
  })

  it('atomically switches between BusinessLens worktrees', () => {
    const bin = temporary('bl-dev-switch-bin-')
    const other = temporary('bl-dev-other-root-')
    const env = { ...process.env, BUSINESSLENS_DEV_BIN_DIR: bin }
    mkdirSync(join(other, 'scripts'), { recursive: true })
    writeFileSync(join(other, 'package.json'), JSON.stringify({ name: 'businesslens' }))
    writeFileSync(join(other, 'scripts', 'bl-dev.mjs'), '#!/usr/bin/env node\n')

    activateDevelopmentLink(other, env)
    const activated = activateDevelopmentLink(ROOT, env)
    expect(execFileSync(activated.link, ['--dev-root'], { env, encoding: 'utf8' }).trim()).toBe(ROOT)
  })

  it('never overwrites an unrelated bl command', () => {
    const bin = temporary('bl-dev-collision-bin-')
    const env = { ...process.env, BUSINESSLENS_DEV_BIN_DIR: bin }
    writeFileSync(join(bin, 'bl'), 'unrelated\n')

    expect(() => activateDevelopmentLink(ROOT, env)).toThrow(/not a symbolic link/)
  })

  it('does not unlink another active worktree', () => {
    const bin = temporary('bl-dev-unlink-bin-')
    const other = temporary('bl-dev-unlink-root-')
    const env = { ...process.env, BUSINESSLENS_DEV_BIN_DIR: bin }
    mkdirSync(join(other, 'scripts'), { recursive: true })
    writeFileSync(join(other, 'package.json'), JSON.stringify({ name: 'businesslens' }))
    writeFileSync(join(other, 'scripts', 'bl-dev.mjs'), '#!/usr/bin/env node\n')
    symlinkSync(join(other, 'scripts', 'bl-dev.mjs'), join(bin, 'bl'))

    expect(() => removeDevelopmentLink(ROOT, env)).toThrow(/another active worktree/)
  })

  it('forwards ordinary CLI arguments and exit codes', () => {
    const result = spawnSync(process.execPath, [join(ROOT, 'scripts', 'bl-dev.mjs'), '--version'], {
      encoding: 'utf8'
    })
    expect(result.status).toBe(0)
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)
  })
})
