import { createInterface } from 'node:readline/promises'
import { submitProject } from '../core/api.js'
import { repoRoot } from '../core/git.js'
import { loadModel } from '../core/model.js'
import { trustedPlatformUrl } from '../core/platform-url.js'
import { buildProject } from './build.js'

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

  try {
    const result = await submitProject(api, project)
    console.log(`Published version ${result.versionKey}: ${result.href}`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
}
