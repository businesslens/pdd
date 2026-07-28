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
    if (path === '/api/v3/projects') {
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

    expect(await runPublish(repo, true)).toBe(1)
    expect(requests).toEqual([])
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('untrusted platform.url'))
  })

  it('submits the portable project targeting its slug in a single call', async () => {
    expect(await runPublish(repo, true)).toBe(0)

    expect(requests).toHaveLength(1)
    const submission = requests[0]!
    expect(submission.path).toBe('/api/v3/projects')
    expect(submission.body.target).toEqual({ projectSlug: submission.body.project.id })
    expect(submission.body.project.source.commit).toMatch(/^[a-f0-9]{40}$/)
    expect(JSON.stringify(submission.body)).not.toContain(API_KEY)
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Published version v1'))

    expect(existsSync(join(repo, '.businesslens/cache/analysis.json'))).toBe(false)
  })

  it('reports a new version on every publish of the same commit', async () => {
    expect(await runPublish(repo, true)).toBe(0)
    expect(await runPublish(repo, true)).toBe(0)

    const submissions = requests.filter(request => request.path === '/api/v3/projects')
    expect(submissions).toHaveLength(2)
    expect(submissions[0]!.body.project.source.commit).toBe(submissions[1]!.body.project.source.commit)
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Published version v2'))
  })

  it('surfaces a failed submission and succeeds on retry', async () => {
    failNextSubmission = true
    expect(await runPublish(repo, true)).toBe(1)
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('status 500'))

    expect(await runPublish(repo, true)).toBe(0)
    expect(requests.filter(request => request.path === '/api/v3/projects')).toHaveLength(2)
  })
})
