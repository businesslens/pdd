import { createHash, randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { PlatformApiError, recordEvent, startAnalysis, submitProject } from '../core/api.js'
import { generatedFilePath, writeGeneratedFile } from '../core/generated-files.js'
import { repoRoot } from '../core/git.js'
import { loadModel } from '../core/model.js'
import { trustedPlatformUrl } from '../core/platform-url.js'
import { buildProject } from './build.js'

interface PublishState {
  schema: 1
  status: 'active' | 'completed'
  commit: string
  repositoryUrl: string
  platformUrl: string
  credentialFingerprint: string
  clientRunId: string
  analysisId?: string
}

type PublishIdentity = Pick<PublishState, 'commit' | 'repositoryUrl' | 'platformUrl' | 'credentialFingerprint'>

function newState(identity: PublishIdentity): PublishState {
  return {
    schema: 1,
    status: 'active',
    ...identity,
    clientRunId: randomUUID()
  }
}

function readState(file: string, identity: PublishIdentity): PublishState {
  if (existsSync(file)) {
    try {
      const state = JSON.parse(readFileSync(file, 'utf8')) as PublishState
      if (
        state.schema === 1
        && state.status === 'active'
        && state.commit === identity.commit
        && state.repositoryUrl === identity.repositoryUrl
        && state.platformUrl === identity.platformUrl
        && state.credentialFingerprint === identity.credentialFingerprint
        && state.clientRunId
      ) return state
    } catch {
      // corrupt state — start fresh
    }
  }
  return newState(identity)
}

function writeState(root: string, state: PublishState): void {
  writeGeneratedFile(
    root,
    ['.businesslens', 'cache', 'analysis.json'],
    `${JSON.stringify(state, null, 2)}\n`
  )
}

export async function runPublish(cwd: string, yes: boolean): Promise<number> {
  const apiKey = process.env.BUSINESSLENS_API_KEY
  if (!apiKey) {
    console.error('BUSINESSLENS_API_KEY is not set. Create a workspace API key on the platform and export it first.')
    return 1
  }

  let root: string
  let model: ReturnType<typeof loadModel>
  let baseUrl: string
  try {
    root = repoRoot(cwd)
    model = loadModel(root)
    baseUrl = trustedPlatformUrl(model.config.platformUrl)
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }

  let outcome
  try {
    outcome = buildProject(root)
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
  const { project } = outcome
  const api = { baseUrl, apiKey }

  if (!yes) {
    if (!process.stdin.isTTY) {
      console.error('Refusing to publish without confirmation in a non-interactive session. Pass --yes.')
      return 2
    }
    const readline = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await readline.question(`Publish ${project.id} @ ${project.source.commit.slice(0, 12)} to ${api.baseUrl}? [y/N] `)
    readline.close()
    if (!/^y(es)?$/i.test(answer.trim())) {
      console.log('Aborted.')
      return 1
    }
  }

  let stateFile: string
  let state: PublishState
  try {
    stateFile = generatedFilePath(root, '.businesslens', 'cache', 'analysis.json')
    state = readState(stateFile, {
      commit: project.source.commit,
      repositoryUrl: project.source.repositoryUrl,
      platformUrl: api.baseUrl,
      credentialFingerprint: createHash('sha256').update(apiKey).digest('hex')
    })
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }

  try {
    if (!state.analysisId) {
      const started = await startAnalysis(api, {
        clientRunId: state.clientRunId,
        repository: { name: project.source.repository, url: project.source.repositoryUrl, branch: project.source.branch },
        revision: { commit: project.source.commit, committedAt: project.source.committedAt },
        generator: project.generator
      })
      state.analysisId = started.analysisId
      writeState(root, state)
    }

    const { summary } = project
    await recordEvent(api, state.analysisId!, {
      clientEventId: `${state.clientRunId}-build`,
      phase: 'analysis',
      message: `Compiled the product map: ${summary.journeys} journeys, ${summary.scenarios} scenarios across ${summary.experiences} experiences.`,
      metrics: { ...summary }
    })
    await recordEvent(api, state.analysisId!, {
      clientEventId: `${state.clientRunId}-validate`,
      phase: 'validation',
      message: 'Map validation passed; submitting the portable project.'
    })

    const result = await submitProject(api, state.analysisId!, project)
    state.status = 'completed'
    writeState(root, state)
    console.log(`${result.created ? 'Created' : 'Updated'} snapshot ${result.versionKey}: ${result.href}`)
    return 0
  } catch (error) {
    if (error instanceof PlatformApiError && error.status === 404) {
      state.status = 'completed'
      writeState(root, state)
    }
    console.error((error as Error).message)
    return 1
  }
}
