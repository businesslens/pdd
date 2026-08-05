import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..')
const SCRIPT = join(ROOT, 'scripts', 'blueprints-publish.mjs')
const { BUSINESSLENS_CATALOG_KEY: _catalogKey, ...envWithoutKey } = process.env

function publishWithEnv(env: NodeJS.ProcessEnv, ...args: string[]) {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: ROOT,
    env,
    encoding: 'utf8'
  })
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? ''
  }
}

function publish(...args: string[]) {
  return publishWithEnv(envWithoutKey, ...args)
}

describe('Blueprint publishing script', () => {
  it('shows its options with --help and -h without requiring a catalog key', () => {
    for (const option of ['--help', '-h']) {
      const result = publish(option)
      expect(result.status).toBe(0)
      expect(result.stderr).toBe('')
      expect(result.stdout).toContain('Usage: npm run blueprints:publish -- [options]')
      expect(result.stdout).toContain('--catalog <origin>')
      expect(result.stdout).toContain('--dry-run')
      expect(result.stdout).toContain('--yes')
      expect(result.stdout).toContain('BUSINESSLENS_CATALOG_KEY')
      expect(result.stdout).toContain('BUSINESSLENS_CATALOG_URL')
      expect(result.stdout).toContain('absent locally are withdrawn')
    }
  })

  it('rejects unknown options with a pointer to help', () => {
    const result = publish('--wat')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Unknown option "--wat"')
    expect(result.stderr).toContain('npm run blueprints:publish -- --help')
  })

  it('reports a missing catalog origin before requiring the key', () => {
    const result = publish('--catalog')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('--catalog requires an origin')
    expect(result.stderr).not.toContain('BUSINESSLENS_CATALOG_KEY is not set')
  })

  it('rejects arbitrary HTTPS origins before a publisher key can be sent', () => {
    for (const origin of [
      'https://attacker.invalid',
      'https://businesslens.io.attacker.invalid',
      'https://www.businesslens.io'
    ]) {
      const result = publishWithEnv(
        { ...envWithoutKey, BUSINESSLENS_CATALOG_KEY: 'must-not-leave-this-process' },
        '--catalog',
        origin,
        '--dry-run'
      )
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('must be https://businesslens.io or a loopback origin')
      expect(result.stderr).not.toContain('Could not read the live catalog')
    }
  })

  it('accepts the production catalog and loopback development origins', () => {
    for (const origin of [
      'https://businesslens.io',
      'http://localhost:3200',
      'http://127.0.0.1:3200',
      'https://[::1]:3200'
    ]) {
      const result = publish('--catalog', origin, '--dry-run')
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('BUSINESSLENS_CATALOG_KEY is not set')
      expect(result.stderr).not.toContain('publisher catalog must be')
    }
  })
})
