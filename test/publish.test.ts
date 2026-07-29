import { execFileSync } from 'node:child_process'
import { createServer, type Server } from 'node:http'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runPublish } from '../src/commands/publish.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')
const API_KEY = 'bl_agent_publish_test'

type RecordedRequest = {
  path: string
  body: Record<string, any>
}

let repo: string
let server: Server
let baseUrl: string
let requests: RecordedRequest[]
let failNextSubmission: boolean
let originalApiKey: string | undefined

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'pipe' })
}

beforeEach(async () => {
  requests = []
  failNextSubmission = false
  server = createServer(async (request, response) => {
    const chunks: Buffer[] = []
    for await (const chunk of request) chunks.push(Buffer.from(chunk))
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, any>
    const path = request.url || ''
    requests.push({ path, body })

    response.setHeader('content-type', 'application/json')
    if (path === '/api/v4/projects') {
      if (failNextSubmission) {
        failNextSubmission = false
        response.statusCode = 500
        response.end(JSON.stringify({ message: 'Temporary failure' }))
        return
      }
      const submissionCount = requests.filter(entry => entry.path === path).length
      response.end(JSON.stringify({
        href: `/workspace/test/projects/fixture-shop/tracks/main?v=v${submissionCount}`,
        versionKey: `v${submissionCount}`
      }))
      return
    }
    response.statusCode = 404
    response.end(JSON.stringify({ message: 'Not found' }))
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Test server did not bind to a TCP port')
  baseUrl = `http://127.0.0.1:${address.port}`

  repo = mkdtempSync(join(tmpdir(), 'bl-publish-'))
  cpSync(FIXTURE, repo, { recursive: true })
  const configFile = join(repo, '.businesslens/config.yaml')
  writeFileSync(
    configFile,
    `${readFileSync(configFile, 'utf8')}platform:\n  url: ${baseUrl}\n`
  )
  git(repo, 'init', '--initial-branch=main')
  git(repo, 'config', 'user.email', 'fixture@example.com')
  git(repo, 'config', 'user.name', 'Fixture')
  git(repo, 'remote', 'add', 'origin', 'https://github.com/example/fixture-shop.git')
  git(repo, 'add', '.')
  git(repo, 'commit', '-m', 'fixture')

  originalApiKey = process.env.BUSINESSLENS_API_KEY
  process.env.BUSINESSLENS_API_KEY = API_KEY
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(async () => {
  vi.restoreAllMocks()
  if (originalApiKey === undefined) delete process.env.BUSINESSLENS_API_KEY
  else process.env.BUSINESSLENS_API_KEY = originalApiKey
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  rmSync(repo, { recursive: true, force: true })
})

describe('publish lifecycle', () => {
  it('refuses a repository-controlled remote platform URL', async () => {
    const configFile = join(repo, '.businesslens/config.yaml')
    writeFileSync(
      configFile,
      readFileSync(configFile, 'utf8').replace(baseUrl, 'https://attacker.example')
    )
    git(repo, 'add', configFile)
    git(repo, 'commit', '-m', 'configure untrusted platform')

    expect(await runPublish(repo, { yes: true })).toBe(1)
    expect(requests).toEqual([])
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('untrusted platform.url'))
  })

  it('submits the report with separate target and provenance in a single call', async () => {
    expect(await runPublish(repo, { yes: true })).toBe(0)

    expect(requests).toHaveLength(1)
    const submission = requests[0]!
    expect(submission.path).toBe('/api/v4/projects')
    expect(submission.body.submissionVersion).toBe('1.0.0')
    expect(submission.body.target).toEqual({
      projectSlug: submission.body.report.id,
      ref: { type: 'branch', name: 'main' }
    })
    expect(submission.body.provenance.resources[0].commit).toMatch(/^[a-f0-9]{40}$/)
    expect(submission.body.report.source).toBeUndefined()
    expect(JSON.stringify(submission.body.report)).not.toContain('github.com/example/fixture-shop')
    expect(JSON.stringify(submission.body)).not.toContain(API_KEY)
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Published version v1'))

    expect(existsSync(join(repo, '.businesslens/cache/analysis.json'))).toBe(false)
  })

  it('truncates an over-long commit subject instead of failing the publish', async () => {
    const subject = `feat: ${'x'.repeat(700)}`
    execFileSync('git', ['commit', '--allow-empty', '-m', subject], { cwd: repo, stdio: 'pipe' })

    expect(await runPublish(repo, { yes: true })).toBe(0)
    const message = requests.at(-1)!.body.provenance.resources[0].commitMessage as string
    expect(message).toHaveLength(500)
    expect(message.endsWith('…')).toBe(true)
    expect(subject.startsWith(message.slice(0, 100))).toBe(true)
  })

  it('reports a new version on every publish of the same commit', async () => {
    expect(await runPublish(repo, { yes: true })).toBe(0)
    expect(await runPublish(repo, { yes: true })).toBe(0)

    const submissions = requests.filter(request => request.path === '/api/v4/projects')
    expect(submissions).toHaveLength(2)
    expect(submissions[0]!.body.provenance.resources[0].commit)
      .toBe(submissions[1]!.body.provenance.resources[0].commit)
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Published version v2'))
  })

  it('surfaces a failed submission and succeeds on retry', async () => {
    failNextSubmission = true
    expect(await runPublish(repo, { yes: true })).toBe(1)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('status 500'))

    expect(await runPublish(repo, { yes: true })).toBe(0)
    expect(requests.filter(request => request.path === '/api/v4/projects')).toHaveLength(2)
  })

  it('refuses dirty authored map provenance even though local build is allowed', async () => {
    writeFileSync(
      join(repo, '.businesslens/product.md'),
      `${readFileSync(join(repo, '.businesslens/product.md'), 'utf8')}\nDirty edit.\n`
    )
    expect(await runPublish(repo, { yes: true })).toBe(1)
    expect(requests).toEqual([])
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('uncommitted'))
  })

  it('publishes an exact tag from a detached checkout', async () => {
    git(repo, 'tag', 'v0.6.0')
    git(repo, 'checkout', '--detach', 'v0.6.0')

    expect(await runPublish(repo, { yes: true, tag: 'v0.6.0' })).toBe(0)
    expect(requests[0]!.body.target.ref).toEqual({ type: 'tag', name: 'v0.6.0' })
    expect(requests[0]!.body.provenance.resources[0].branch).toBe('v0.6.0')
  })

  it('publishes a pull request track with its base metadata', async () => {
    expect(await runPublish(repo, {
      yes: true,
      pullRequest: 42,
      baseBranch: 'main',
      prTitle: 'Add checkout',
      prUrl: 'https://github.com/example/fixture-shop/pull/42'
    })).toBe(0)

    expect(requests[0]!.body.target.ref).toEqual({
      type: 'pull-request',
      number: 42,
      baseBranch: 'main',
      title: 'Add checkout',
      url: 'https://github.com/example/fixture-shop/pull/42'
    })
    expect(requests[0]!.body.provenance.resources[0].branch).toBe('main')
  })

  it('rejects incomplete pull-request targeting before building or submitting', async () => {
    expect(await runPublish(repo, { yes: true, pullRequest: 42 })).toBe(2)
    expect(requests).toEqual([])
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('--base-branch'))
  })
})
