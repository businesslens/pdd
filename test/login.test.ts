import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runLogin } from '../src/commands/login.js'
import { credentialsFile, readCredentials } from '../src/core/credentials.js'

const temporaryDirectories: string[] = []

function temporary(): string {
  const directory = mkdtempSync(join(tmpdir(), 'bl-login-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(() => {
  vi.restoreAllMocks()
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('CLI login', () => {
  it('completes device authorization and stores a CLI session without printing it', async () => {
    const configDir = temporary()
    const token = 'session-secret-that-must-not-be-printed'
    const responses = [
      new Response(JSON.stringify({
        device_code: 'device-code',
        user_code: 'ABCD-EFGH',
        verification_uri: 'http://127.0.0.1:3000/device',
        verification_uri_complete: 'http://127.0.0.1:3000/device?user_code=ABCD-EFGH',
        expires_in: 600,
        interval: 1
      }), { headers: { 'content-type': 'application/json' } }),
      new Response(JSON.stringify({
        error: 'authorization_pending',
        error_description: 'Pending'
      }), { status: 400, headers: { 'content-type': 'application/json' } }),
      new Response(JSON.stringify({
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'blueprints:read'
      }), { headers: { 'content-type': 'application/json' } })
    ]
    const fetcher = vi.fn(async () => responses.shift()!)
    const openBrowser = vi.fn(() => true)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runLogin(
      { platform: 'http://127.0.0.1:3000' },
      {
        configDir,
        fetch: fetcher as typeof fetch,
        openBrowser,
        wait: async () => undefined,
        now: () => Date.parse('2026-07-29T12:00:00.000Z')
      }
    )).toBe(0)

    expect(openBrowser).toHaveBeenCalledWith(
      'http://127.0.0.1:3000/device?user_code=ABCD-EFGH'
    )
    expect(fetcher).toHaveBeenCalledTimes(3)
    const credentials = readCredentials(configDir, Date.parse('2026-07-29T12:00:01.000Z'))
    expect(credentials).toMatchObject({
      platformUrl: 'http://127.0.0.1:3000',
      accessToken: token
    })
    expect(statSync(credentialsFile(configDir)).mode & 0o777).toBe(0o600)
    expect(readFileSync(credentialsFile(configDir), 'utf8')).toContain(token)
    expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain(token)
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(token)
  })

  it('rejects a device verification URL on a different origin', async () => {
    const configDir = temporary()
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      device_code: 'device-code',
      user_code: 'ABCD-EFGH',
      verification_uri_complete: 'https://attacker.example/device?user_code=ABCD-EFGH',
      expires_in: 600,
      interval: 1
    }), { headers: { 'content-type': 'application/json' } }))
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await runLogin(
      { platform: 'http://localhost:3000' },
      {
        configDir,
        fetch: fetcher as typeof fetch,
        openBrowser: () => true,
        wait: async () => undefined
      }
    )).toBe(1)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('different origin'))
    expect(() => readFileSync(credentialsFile(configDir), 'utf8')).toThrow()
  })
})
