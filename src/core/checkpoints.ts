/**
 * Checkpoints: compiled reports sealed into `.businesslens/cache/checkpoints/`.
 *
 * The CLI's `checkpoint` command and the local report server's checkpoint API
 * use this shared writer. The server also reads snapshots for comparisons;
 * the browser requests a snapshot through Create a checkpoint. Cache files survive
 * server restarts, and the CLI can create them while the server is stopped.
 * A checkpoint records an explicitly requested baseline, regardless of who
 * edited the model or its referenced files. Lint creates no checkpoints.
 * `cache/` is generated and never committed, so `.businesslens/` still holds
 * product meaning and nothing else that is tracked.
 *
 * A small `<id>.json` for the list, `<id>.report.json` for the model, and
 * `<id>.references.json` for local file contents at the same boundary.
 */
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { closeSync, existsSync, lstatSync, openSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import { compileReport } from '../commands/export.js'
import { lintModel } from '../commands/lint.js'
import { generatedFilePath } from './generated-files.js'
import { git } from './git.js'
import { loadModel } from './model.js'
import type { ModelRoot } from './model-root.js'
import type { ProductReportV13 } from './portable.js'
import { canonicalReportJson, ProductReportV13Schema } from './portable.js'
import type { CheckpointSource } from './report-diff.js'
import { reportDigest } from './report-digest.js'
import { committedReferenceFiles, createReferenceFileSource, ReferenceFilesSchema } from './reference-files.js'
import type { ReportReferenceFiles } from './report-reference-files.js'

export interface CheckpointMeta {
  id: string
  /** ISO timestamp of the seal. */
  at: string
  source: CheckpointSource
  label: string | null
  /** SHA-256 of the report; local files carry their own fingerprints. */
  digest: string
}

export interface Checkpoint extends CheckpointMeta {
  report: ProductReportV13
  referenceFiles?: ReportReferenceFiles
}

/** How many checkpoints the ring keeps; the oldest beyond it are removed. */
export const CHECKPOINT_LIMIT = 50
export const CHECKPOINT_CONTENT_BUDGET = 100 * 1024 * 1024
export const CHECKPOINT_LABEL_LIMIT = 120

const META_FILE = /^(\d{8}T\d{9}Z)\.json$/

export function checkpointsDirectory(modelRoot: string): string {
  return join(modelRoot, '.businesslens', 'cache', 'checkpoints')
}

/** Validate a label as the CLI and the viewer's pin both accept it. */
export function normalizeCheckpointLabel(label: string | null | undefined): string | null {
  if (label === null || label === undefined) return null
  const value = label.replace(/\s+/g, ' ').trim()
  if (!value) return null
  if (value.length > CHECKPOINT_LABEL_LIMIT) {
    throw new Error(`A checkpoint label is at most ${CHECKPOINT_LABEL_LIMIT} characters.`)
  }
  return value
}

/** Sortable, filename-safe, and unique to the millisecond. */
function checkpointId(at: Date): string {
  return at.toISOString().replace(/[-:.]/g, '')
}

function readMeta(directory: string, file: string): CheckpointMeta | undefined {
  const id = META_FILE.exec(file)?.[1]
  if (!id) return undefined
  try {
    const parsed = JSON.parse(readFileSync(join(directory, file), 'utf8')) as Partial<CheckpointMeta>
    // The filename owns the identity. Cache contents are repository-controlled
    // and must never supply a different path for reading or pruning.
    if (parsed.id !== id || typeof parsed.at !== 'string' || typeof parsed.digest !== 'string') return undefined
    if (parsed.source !== 'checkpoint' && parsed.source !== 'pin') return undefined
    return {
      id,
      at: parsed.at,
      source: parsed.source,
      label: typeof parsed.label === 'string' ? parsed.label : null,
      digest: parsed.digest
    }
  } catch {
    return undefined
  }
}

/** Every checkpoint in the directory, newest first. A missing directory is an empty list. */
export function listCheckpoints(directory: string): CheckpointMeta[] {
  let files: string[]
  try {
    files = readdirSync(directory)
  } catch {
    return []
  }
  return files
    .filter(file => META_FILE.test(file))
    .sort()
    .reverse()
    .flatMap((file) => {
      const meta = readMeta(directory, file)
      return meta ? [meta] : []
    })
}

export function readCheckpoint(directory: string, id: string): Checkpoint | undefined {
  if (!META_FILE.test(`${id}.json`)) return undefined
  const meta = readMeta(directory, `${id}.json`)
  if (!meta) return undefined
  try {
    const report = ProductReportV13Schema.parse(JSON.parse(readFileSync(join(directory, `${id}.report.json`), 'utf8')))
    let referenceFiles: ReportReferenceFiles | undefined
    try {
      referenceFiles = ReferenceFilesSchema.parse(JSON.parse(readFileSync(join(directory, `${id}.references.json`), 'utf8'))).files
    } catch { /* Older or incomplete checkpoints can still compare model fields. */ }
    return { ...meta, report, referenceFiles }
  } catch {
    return undefined
  }
}

/**
 * Seal one report. Always: whoever ran this asked for a boundary here, and an
 * empty comparison against it is a true statement about the round.
 */
export function writeCheckpoint(
  modelRoot: string,
  report: ProductReportV13,
  options: { source: CheckpointSource, label?: string | null, now?: Date, referenceRoot?: string }
): CheckpointMeta {
  const label = normalizeCheckpointLabel(options.label)
  const digest = reportDigest(report)
  const directory = ensureCheckpointsDirectory(modelRoot)
  const lock = generatedFilePath(modelRoot, '.businesslens', 'cache', 'checkpoints', '.write-lock')
  const release = checkpointLock(lock)
  try {
    const captured = new Set<string>()
    let bytes = 0
    const referenceFiles = createReferenceFileSource(options.referenceRoot ?? modelRoot, (body, digest) => {
      if (captured.has(digest)) return 'stored'
      if (bytes + body.length > CHECKPOINT_CONTENT_BUDGET) return 'budget-exceeded'
      const file = generatedFilePath(modelRoot, '.businesslens', 'cache', 'checkpoints', 'blobs', digest)
      // Rewrite under the lock: a corrupt existing cache blob must not poison a new checkpoint.
      writeFileSync(file, body, { mode: 0o600 })
      captured.add(digest)
      bytes += body.length
      return 'stored'
    })(report)

    let at = options.now ?? new Date()
    let id = checkpointId(at)
    while (existsSync(join(directory, `${id}.json`))) {
      at = new Date(at.getTime() + 1)
      id = checkpointId(at)
    }
    const meta: CheckpointMeta = { id, at: at.toISOString(), source: options.source, label, digest }
    const reportFile = generatedFilePath(modelRoot, '.businesslens', 'cache', 'checkpoints', `${id}.report.json`)
    writeFileSync(reportFile, `${canonicalReportJson(report)}\n`)
    const referencesFile = generatedFilePath(modelRoot, '.businesslens', 'cache', 'checkpoints', `${id}.references.json`)
    writeFileSync(referencesFile, `${JSON.stringify({ version: 1, files: referenceFiles })}\n`, { mode: 0o600 })
    const metaFile = generatedFilePath(modelRoot, '.businesslens', 'cache', 'checkpoints', `${id}.json`)
    writeFileSync(metaFile, `${JSON.stringify(meta, null, 2)}\n`)
    pruneCheckpoints(directory)
    return meta
  } finally { release() }
}

/** Serialize publication and blob pruning across the CLI and server. */
function checkpointLock(path: string): () => void {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const fd = openSync(path, 'wx', 0o600)
      try { writeFileSync(fd, String(process.pid)) } finally { closeSync(fd) }
      return () => unlinkSync(path)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      const pid = Number(readFileSync(path, 'utf8'))
      if (Number.isSafeInteger(pid) && pid > 0) {
        try { process.kill(pid, 0) } catch (probe) {
          if ((probe as NodeJS.ErrnoException).code === 'ESRCH') { unlinkSync(path); continue }
        }
      }
      throw new Error('Another checkpoint is being created. Try again when it finishes.')
    }
  }
  throw new Error('Could not acquire the checkpoint writer.')
}

function pruneCheckpoints(directory: string): void {
  const checkpoints = listCheckpoints(directory)
  const retained = new Set<string>()
  for (const meta of checkpoints.slice(0, CHECKPOINT_LIMIT)) {
    const snapshot = readCheckpoint(directory, meta.id)
    for (const file of Object.values(snapshot?.referenceFiles ?? {})) {
      if (file.status === 'present' && file.content === 'stored') retained.add(file.digest)
    }
  }
  for (const meta of checkpoints.slice(CHECKPOINT_LIMIT)) {
    for (const file of [`${meta.id}.json`, `${meta.id}.report.json`, `${meta.id}.references.json`]) {
      try { unlinkSync(join(directory, file)) } catch { /* Already gone. */ }
    }
  }
  const blobs = join(directory, 'blobs')
  if (existsSync(blobs) && !lstatSync(blobs).isSymbolicLink()) {
    for (const digest of readdirSync(blobs)) {
      if (/^[a-f0-9]{64}$/.test(digest) && !retained.has(digest)) unlinkSync(join(blobs, digest))
    }
  }
}

/** A saved file is served only from its checkpoint, with its digest verified. */
export function checkpointReferenceBody(directory: string, checkpoint: Checkpoint, path: string): Buffer {
  const file = checkpoint.referenceFiles?.[path]
  if (!file || file.status !== 'present') throw new Error('This file was not captured in this checkpoint.')
  let body: Buffer
  if (file.content === 'stored') {
    const blobs = join(directory, 'blobs')
    const target = join(blobs, file.digest)
    if (lstatSync(blobs).isSymbolicLink() || lstatSync(target).isSymbolicLink() || !lstatSync(target).isFile() || lstatSync(target).size !== file.bytes) {
      throw new Error('This checkpoint file is unavailable.')
    }
    body = readFileSync(target)
  } else if (file.text !== null) body = Buffer.from(file.text, 'utf8')
  else throw new Error(file.content === 'budget-exceeded'
    ? 'This file exceeded the checkpoint content budget; its contents were not saved.'
    : 'This older checkpoint records the file fingerprint but did not save its contents.')
  if (createHash('sha256').update(body).digest('hex') !== file.digest) throw new Error('This checkpoint file failed its integrity check.')
  return body
}

/**
 * Create the directory the viewer watches, refusing a symbolic link in its
 * path. Resolving a generated file path creates and checks every parent.
 */
export function ensureCheckpointsDirectory(modelRoot: string): string {
  return dirname(generatedFilePath(modelRoot, '.businesslens', 'cache', 'checkpoints', '.keep'))
}

/* ------------------------------------------------------------------ */
/* The committed baseline                                              */
/* ------------------------------------------------------------------ */

export interface CommittedReport {
  commit: string
  subject: string
  committedAt: string
  report: ProductReportV13
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

/**
 * The committed baseline, recompiled only when HEAD moves.
 *
 * A failure is remembered for the same commit too, so a broken committed model
 * costs one compile rather than one per request.
 */
export function createCommittedReportSource(resolved: ModelRoot): () => CommittedReport {
  let cached: { commit: string | undefined, value?: CommittedReport, error?: Error } | undefined
  return () => {
    let commit: string | undefined
    try {
      commit = resolved.gitRoot ? git(resolved.gitRoot, 'rev-parse', '--verify', 'HEAD') : undefined
    } catch {
      commit = undefined
    }
    if (cached && cached.commit === commit) {
      if (cached.error) throw cached.error
      return cached.value!
    }
    try {
      const value = compileCommittedReport(resolved)
      cached = { commit: value.commit, value }
      return value
    } catch (error) {
      cached = { commit, error: error as Error }
      throw error
    }
  }
}
