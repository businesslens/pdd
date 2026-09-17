/** Compile historical Product Models from Git objects without changing the checkout. */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import { compileReport } from '../commands/export.js'
import { lintModel } from '../commands/lint.js'
import { git } from './git.js'
import { loadModel } from './model.js'
import type { ModelRoot } from './model-root.js'
import type { ProductReportV16 } from './portable.js'
import { committedReferenceFiles } from './reference-files.js'
import type { ReportReferenceFiles } from './report-reference-files.js'

export interface CommittedReport {
  commit: string
  subject: string
  committedAt: string
  report: ProductReportV16
  referenceFiles?: ReportReferenceFiles
}

function posix(path: string): string {
  return path.split(sep).join('/')
}

/**
 * Read every blob under a tree prefix at HEAD in one `git cat-file --batch`.
 *
 * One process for the whole model rather than one `git show` per file, and
 * binary-safe, since a model may carry a logo and mockups.
 */
function committedBlobs(gitRoot: string, commit: string, paths: string[]): Map<string, Buffer> {
  const result = spawnSync('git', ['-C', gitRoot, 'cat-file', '--batch'], {
    input: paths.map(path => `${commit}:${path}\n`).join(''),
    maxBuffer: 256 * 1024 * 1024
  })
  if (result.status !== 0) throw new Error(result.stderr.toString('utf8').trim() || 'git cat-file failed')
  const output = result.stdout
  const blobs = new Map<string, Buffer>()
  let offset = 0
  for (const path of paths) {
    const newline = output.indexOf(0x0a, offset)
    if (newline < 0) throw new Error(`git cat-file returned no entry for ${path}`)
    const header = output.subarray(offset, newline).toString('utf8')
    offset = newline + 1
    const parts = header.split(' ')
    if (parts[1] === 'missing') throw new Error(`HEAD does not contain ${path}`)
    const size = Number(parts[2])
    blobs.set(path, output.subarray(offset, offset + size))
    offset += size + 1
  }
  return blobs
}

/**
 * Compile the Product Model as the last commit has it.
 *
 * The model loader reads a directory, so the committed `.businesslens/` is
 * materialized into a temporary one and compiled by the same path the working
 * tree takes, tracked files listed from HEAD rather than the index. Nothing in
 * the target repository runs. Throws with a reason the viewer can show when
 * there is no repository, no committed model, or a committed model that does
 * not lint.
 */
export function compileCommittedReport(resolved: ModelRoot, today = new Date().toISOString().slice(0, 10), revision = 'HEAD'): CommittedReport {
  if (!resolved.gitRoot) throw new Error('This Product Model is not in a Git repository, so it has no committed baseline.')
  /* Git reports the real path; the model root is whatever the command was
     given, and on macOS a temporary directory is reached through a symlink. */
  const gitRoot = realpathSync(resolved.gitRoot)
  const modelRoot = realpathSync(resolved.modelRoot)
  let commit: string
  try {
    commit = git(gitRoot, 'rev-parse', '--verify', '--end-of-options', `${revision}^{commit}`)
  } catch {
    throw new Error('The Product Model has not been committed yet, so there is no committed baseline.')
  }
  const prefix = posix(join(relative(gitRoot, modelRoot), '.businesslens'))
  const listed = git(gitRoot, 'ls-tree', '-r', '-z', '--name-only', commit, '--', prefix)
  const paths = listed.split('\0').filter(Boolean)
  if (!paths.length) throw new Error('The Product Model has not been committed yet, so there is no committed baseline.')

  const scratch = mkdtempSync(join(tmpdir(), 'businesslens-committed-'))
  try {
    for (const [path, body] of committedBlobs(gitRoot, commit, paths)) {
      const target = join(scratch, ...path.split('/'))
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, body)
    }
    const committedRoot = join(scratch, relative(gitRoot, modelRoot))
    const model = loadModel(committedRoot)
    const tracked = git(gitRoot, 'ls-tree', '-r', '-z', '--name-only', commit).split('\0').filter(Boolean)
    const lint = lintModel(model, tracked)
    if (!lint.ok) {
      throw new Error(`The committed Product Model does not lint:\n${lint.errors.map(error => `- ${error}`).join('\n')}`)
    }
    const report = compileReport(model, today, scratch)
    return {
      commit,
      subject: git(gitRoot, 'show', '-s', '--format=%s', commit),
      committedAt: git(gitRoot, 'show', '-s', '--format=%cI', commit),
      report,
      referenceFiles: committedReferenceFiles(gitRoot, commit, report)
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}
