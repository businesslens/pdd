import { createInterface } from 'node:readline/promises'
import { submitProject } from '../core/api.js'
import { git, provenance, repoRoot } from '../core/git.js'
import { loadModel } from '../core/model.js'
import { trustedPlatformUrl } from '../core/platform-url.js'
import type { SubmissionRef } from '../core/portable.js'
import { ProjectSubmissionV4Schema, SUBMISSION_SCHEMA_VERSION } from '../core/portable.js'
import { buildProject } from './build.js'

export interface PublishOptions {
  yes: boolean
  tag?: string
  pullRequest?: number
  baseBranch?: string
  prTitle?: string
  prUrl?: string
}

class PublishUsageError extends Error {}

function validatePublishOptions(options: PublishOptions): void {
  if (options.tag && options.pullRequest !== undefined) {
    throw new PublishUsageError('--tag and --pull-request are mutually exclusive.')
  }
  if (options.pullRequest !== undefined) {
    if (!Number.isInteger(options.pullRequest) || options.pullRequest <= 0) {
      throw new PublishUsageError('--pull-request must be a positive integer.')
    }
    if (!options.baseBranch) {
      throw new PublishUsageError('--base-branch is required with --pull-request.')
    }
  } else if (options.baseBranch || options.prTitle || options.prUrl) {
    throw new PublishUsageError('--base-branch, --pr-title, and --pr-url require --pull-request.')
  }
  for (const [label, value] of [
    ['--tag', options.tag],
    ['--base-branch', options.baseBranch],
    ['--pr-title', options.prTitle]
  ] as const) {
    if (value !== undefined && (!value.trim() || /[\r\n]/.test(value) || value.length > 200)) {
      throw new PublishUsageError(`${label} must be non-empty, single-line text of at most 200 characters.`)
    }
  }
  if (options.prUrl) {
    try {
      new URL(options.prUrl)
    } catch {
      throw new PublishUsageError('--pr-url must be an absolute URL.')
    }
  }
}

function verifyTagAtHead(root: string, tag: string): void {
  let taggedCommit: string
  try {
    taggedCommit = git(root, 'rev-parse', '--verify', `refs/tags/${tag}^{commit}`)
  } catch {
    throw new Error(`Tag "${tag}" does not exist in this repository.`)
  }
  if (taggedCommit !== git(root, 'rev-parse', 'HEAD')) {
    throw new Error(`Tag "${tag}" does not point at HEAD. Check out the tagged commit before publishing it.`)
  }
}

function targetRef(options: PublishOptions, branch: string): SubmissionRef {
  if (options.tag) return { type: 'tag', name: options.tag }
  if (options.pullRequest !== undefined) {
    return {
      type: 'pull-request',
      number: options.pullRequest,
      baseBranch: options.baseBranch!,
      ...(options.prTitle ? { title: options.prTitle } : {}),
      ...(options.prUrl ? { url: options.prUrl } : {})
    }
  }
  return { type: 'branch', name: branch }
}

function describeRef(ref: SubmissionRef): string {
  if (ref.type === 'pull-request') return `pull request #${ref.number} into ${ref.baseBranch}`
  return `${ref.type} "${ref.name}"`
}

export async function runPublish(cwd: string, options: PublishOptions): Promise<number> {
  try {
    validatePublishOptions(options)
  } catch (error) {
    console.error((error as Error).message)
    return error instanceof PublishUsageError ? 2 : 1
  }

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
  const { report } = outcome
  const api = { baseUrl, apiKey }

  let pinned: ReturnType<typeof provenance>
  try {
    if (options.tag) verifyTagAtHead(root, options.tag)
    pinned = provenance(root, { detachedHeadName: options.tag })
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }

  const ref = targetRef(options, pinned.branch)
  let submission
  try {
    submission = ProjectSubmissionV4Schema.parse({
      submissionVersion: SUBMISSION_SCHEMA_VERSION,
      target: { projectSlug: report.id, ref },
      provenance: {
        resources: [{
          kind: 'git-repository',
          name: pinned.repository,
          url: pinned.repositoryUrl,
          branch: pinned.branch,
          commit: pinned.commit,
          ...(pinned.commitMessage ? { commitMessage: pinned.commitMessage } : {}),
          committedAt: pinned.committedAt
        }],
        analyzedAt: new Date().toISOString()
      },
      report
    })
  } catch (error) {
    console.error(`Cannot construct a valid publish submission: ${(error as Error).message}`)
    return 1
  }

  if (!options.yes) {
    if (!process.stdin.isTTY) {
      console.error('Refusing to publish without confirmation in a non-interactive session. Pass --yes.')
      return 2
    }
    const readline = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await readline.question(
      `Publish ${report.id} @ ${pinned.commit.slice(0, 12)} to ${describeRef(ref)} on ${api.baseUrl}? [y/N] `
    )
    readline.close()
    if (!/^y(es)?$/i.test(answer.trim())) {
      console.log('Aborted.')
      return 1
    }
  }

  try {
    const result = await submitProject(api, submission)
    console.log(`Published version ${result.versionKey}: ${result.href}`)
    return 0
  } catch (error) {
    console.error((error as Error).message)
    return 1
  }
}
