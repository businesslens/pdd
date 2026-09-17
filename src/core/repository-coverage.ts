import { createHash, randomUUID } from 'node:crypto'
import { constants, existsSync, realpathSync } from 'node:fs'
import { mkdir, readFile, writeFile, rename, rm, lstat, readlink, readdir, open } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { z } from 'zod'
import { git, repoRoot } from './git.js'
import { resolveModelRoot } from './model-root.js'
import { loadModel } from './model.js'
import { repositoryInventory } from './repository-inventory.js'
import { compileResolvedWorkspaceReport } from '../commands/export.js'
import { CoverageDocumentSchema, CoverageReviewSchema, CoverageReviewEntrySchema, CoverageReviewPolicySchema, type CoverageDocument } from './coverage.js'
import { canonicalReportJson } from './portable.js'
import type { CoverageComparison, CoverageReviewEntry, CoverageReviewFile, CoverageReviewPolicy, CoverageReview, RepositoryInventory } from './coverage.js'

const posix = (path: string) => path.split(sep).join('/')
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
const storeSchema = z.strictObject({ version: z.literal(1), pending: CoverageReviewSchema.nullable() })
type Store = z.infer<typeof storeSchema>
interface Context { root: string, modelRoot: string, storeFile: string }

function context(cwd: string, requestedModelRoot?: string): Context {
  const root = realpathSync(repoRoot(cwd))
  let modelRoot = requestedModelRoot
  if (!modelRoot) {
    try { modelRoot = resolveModelRoot(cwd).modelRoot }
    catch { modelRoot = resolve(cwd) }
  }
  modelRoot = realpathSync(modelRoot)
  const modelPath = posix(relative(root, modelRoot))
  if (modelPath === '..' || modelPath.startsWith('../') || isAbsolute(modelPath)) throw new Error('The model must be inside this Git worktree.')
  const directory = resolve(root, git(root, 'rev-parse', '--git-path', 'businesslens/coverage'))
  return { root, modelRoot, storeFile: join(directory, `${hash(modelPath || '.')}.json`) }
}

async function readStore(ctx: Context): Promise<Store> {
  try {
    const raw = await readFile(ctx.storeFile, 'utf8')
    const parsed = storeSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) throw new Error('Unsupported or invalid review record')
    if (parsed.data.pending?.completedAt) throw new Error('Pending review is already complete')
    return parsed.data
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { version: 1, pending: null }
    throw new Error(`Cannot read the local repository review: ${(error as Error).message}. Record: ${ctx.storeFile}`)
  }
}

async function mutate<T>(ctx: Context, operation: (store: Store) => Promise<T>): Promise<T> {
  await mkdir(dirname(ctx.storeFile), { recursive: true })
  const lock = `${ctx.storeFile}.lock`
  let handle
  try { handle = await open(lock, 'wx', 0o600) }
  catch { throw new Error(`Another review command holds the lock: ${lock}`) }
  const temporary = `${ctx.storeFile}.${randomUUID()}.tmp`
  try {
    const store = await readStore(ctx)
    const result = await operation(store)
    storeSchema.parse(store)
    await writeFile(temporary, JSON.stringify(store, null, 2) + '\n', { mode: 0o600, flag: 'wx' })
    await rename(temporary, ctx.storeFile)
    return result
  } finally {
    await rm(temporary, { force: true })
    await handle.close()
    await rm(lock, { force: true })
  }
}

/** Read shared Coverage separately from worktree-local pending work. */
async function readCoverage(ctx: Pick<Context, 'modelRoot'>): Promise<{ raw: string, document: CoverageDocument } | null> {
  try {
    await safeParents(ctx.modelRoot, '.businesslens/coverage.json')
    const handle = await open(join(ctx.modelRoot, '.businesslens/coverage.json'), constants.O_RDONLY | constants.O_NOFOLLOW)
    try {
      const raw = await handle.readFile('utf8')
      return { raw, document: CoverageDocumentSchema.parse(JSON.parse(raw)) }
    } finally { await handle.close() }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw new Error(`Cannot read .businesslens/coverage.json: ${(error as Error).message}`)
  }
}

function orderedReview(review: CoverageReview): CoverageReview {
  return {
    ...review,
    files: [...review.files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0),
    entries: review.entries.map(entry => ({ ...entry, paths: [...entry.paths].sort(), resources: [...entry.resources].sort(), exclusions: [...entry.exclusions].sort(), gaps: [...entry.gaps].sort() }))
      .sort((a, b) => a.paths[0]! < b.paths[0]! ? -1 : a.paths[0]! > b.paths[0]! ? 1 : 0)
  }
}

async function publishReview(ctx: Context, original: string, document: CoverageDocument, review: CoverageReview): Promise<void> {
  const directory = join(ctx.modelRoot, '.businesslens/cache')
  await mkdir(directory, { recursive: true })
  await safeParents(ctx.modelRoot, '.businesslens/cache/coverage.tmp')
  const temporary = join(directory, `coverage-${randomUUID()}.tmp`)
  try {
    await writeFile(temporary, JSON.stringify({ ...document, review: orderedReview(review) }, null, 2) + '\n', { flag: 'wx' })
    if ((await readCoverage(ctx))?.raw !== original) throw new Error('Coverage changed while completing the review. Retry after authoring settles.')
    await rename(temporary, join(ctx.modelRoot, '.businesslens/coverage.json'))
  } finally { await rm(temporary, { force: true }) }
}

const selected = (path: string, selector: string) => path === selector.replace(/\/$/, '') || (selector.endsWith('/') && path.startsWith(selector))
const modelMaterial = (path: string) => path.split('/').some(part => part === '.businesslens' || part.startsWith('.businesslens.backup-'))

/** Include each project file exactly once. Ignored paths enter only by explicit policy. */
async function inventoryPaths(root: string, policy: CoverageReviewPolicy): Promise<string[]> {
  const normal = (await repositoryInventory(root, false)).paths
  const extra = policy.includePaths.length ? (await repositoryInventory(root, true)).paths.filter(path => policy.includePaths.some(selector => selected(path, selector))) : []
  return [...new Set([...normal, ...extra])].filter(path => !modelMaterial(path)).sort()
}

/** No file reads through symlinks, including symlinked parent directories. */
async function safeParents(root: string, path: string): Promise<void> {
  const parts = path.split('/')
  let current = root
  for (const part of parts.slice(0, -1)) {
    current = join(current, part)
    if ((await lstat(current)).isSymbolicLink()) throw new Error('A parent directory is a symbolic link')
  }
}

async function fingerprint(root: string, path: string): Promise<CoverageReviewFile> {
  try {
    await safeParents(root, path)
    const absolute = join(root, path)
    const stat = await lstat(absolute)
    if (stat.isSymbolicLink()) return { path, digest: hash(`symlink\0${await readlink(absolute)}`) }
    if (!stat.isFile()) return { path, digest: null, error: 'Submodule or directory contents require a separate review.' }
    const handle = await open(absolute, constants.O_RDONLY | constants.O_NOFOLLOW)
    try {
      const before = await handle.stat()
      const digest = createHash('sha256').update(`file\0${before.mode & 0o111 ? 'executable' : 'regular'}\0`)
      for await (const chunk of handle.createReadStream({ autoClose: false })) digest.update(chunk)
      const after = await handle.stat()
      const current = await lstat(absolute)
      if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || before.ino !== current.ino || after.mtimeMs !== current.mtimeMs) {
        return { path, digest: null, error: 'File changed while its contents were being captured.' }
      }
      return { path, digest: digest.digest('hex') }
    } finally { await handle.close() }
  } catch { return { path, digest: null, error: 'File contents could not be read safely.' } }
}

async function parallelMap<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(8, items.length) }, async () => {
    for (;;) {
      const index = next++
      if (index >= items.length) return
      output[index] = await fn(items[index]!)
    }
  }))
  return output
}

async function snapshot(root: string, policy: CoverageReviewPolicy): Promise<CoverageReviewFile[]> {
  return parallelMap(await inventoryPaths(root, policy), path => fingerprint(root, path))
}

async function modelFingerprint(modelRoot: string): Promise<string | null> {
  const root = join(modelRoot, '.businesslens')
  try { await lstat(root) } catch { return null }
  if ((await lstat(root)).isSymbolicLink()) throw new Error('Cannot fingerprint a symbolic-link Product Model.')
  const paths: string[] = []
  async function walk(path: string) {
    for (const entry of await readdir(join(root, path), { withFileTypes: true })) {
      if (!path && ['build', 'cache'].includes(entry.name)) continue
      const target = path ? `${path}/${entry.name}` : entry.name
      if (entry.isSymbolicLink()) throw new Error(`Cannot bind an review to a symbolic link in the Product Model: ${target}`)
      if (entry.isDirectory()) await walk(target)
      else paths.push(target)
    }
  }
  await walk('')
  const files = await parallelMap(paths.sort(), async path => {
    if (path !== 'coverage.json') return fingerprint(root, path)
    const saved = await readCoverage({ modelRoot })
    if (!saved) throw new Error('Coverage disappeared while capturing the model fingerprint.')
    const { review: _review, ...authored } = saved.document
    return { path, digest: hash(canonicalReportJson(authored)) }
  })
  if (files.some(file => !file.digest)) throw new Error('The Product Model could not be fingerprinted completely.')
  return hash(JSON.stringify(files))
}

function requirePending(store: Store, id: string): CoverageReview {
  if (!store.pending || store.pending.id !== id) throw new Error('No pending review has this ID. Run coverage status to find the current worklist.')
  return store.pending
}

function validateLinks(ctx: Context, entries: CoverageReviewEntry[]): void {
  const model = loadModel(ctx.modelRoot)
  const resources = new Set([
    ...['product.md', 'product/product.md'].filter(path => existsSync(join(ctx.modelRoot, '.businesslens', path))),
    ...[model.interfaces, model.experiences, model.screens, model.domains, model.entities, model.capabilities, model.capabilityScenarios, model.journeys, model.journeyScenarios, model.businessRules].flat().map(resource => posix(relative(join(ctx.modelRoot, '.businesslens'), resource.file)))
  ])
  const exclusions = new Set(model.coverage.exclusions.map(area => area.description))
  const gaps = new Set(model.coverage.unmapped.map(area => area.description))
  for (const entry of entries) {
    for (const resource of entry.resources) if (!resources.has(resource)) throw new Error(`Unknown model resource: ${resource}`)
    for (const description of entry.exclusions) if (!exclusions.has(description)) throw new Error(`Unknown Coverage exclusion: ${description}`)
    for (const description of entry.gaps) if (!gaps.has(description)) throw new Error(`Unknown Coverage gap: ${description}`)
  }
}

export async function startCoverageReview(cwd: string, includePaths: string[] = []): Promise<CoverageReview> {
  const ctx = context(cwd)
  const policy = CoverageReviewPolicySchema.parse({ version: 'project-files-v1', includePaths: [...new Set(includePaths)].sort() })
  return mutate(ctx, async store => {
    if (store.pending) throw new Error(`Review ${store.pending.id} is still pending. Finish or cancel it before starting another.`)
    const files = await snapshot(ctx.root, policy)
    for (const selector of policy.includePaths) if (!files.some(file => selected(file.path, selector))) throw new Error(`Included path has no assessable files: ${selector}`)
    const pending: CoverageReview = { id: randomUUID(), startedAt: new Date().toISOString(), completedAt: null, modelDigest: null, policy, files, entries: [] }
    store.pending = pending
    return pending
  })
}

export async function recordCoverageReview(cwd: string, input: unknown): Promise<CoverageReview> {
  const packet = z.strictObject({ reviewId: z.string().uuid(), entries: z.array(CoverageReviewEntrySchema).min(1) }).parse(input)
  const paths = packet.entries.flatMap(entry => entry.paths)
  if (new Set(paths).size !== paths.length) throw new Error('A file may occur only once in a recording packet.')
  const ctx = context(cwd)
  return mutate(ctx, async store => {
    const pending = requirePending(store, packet.reviewId)
    validateLinks(ctx, packet.entries)
    const captured = new Map(pending.files.map(file => [file.path, file]))
    for (const entry of packet.entries) for (const path of entry.paths) {
      const before = captured.get(path)
      if (!before) throw new Error(`Path was not in this review snapshot: ${path}`)
      const current = await fingerprint(ctx.root, path)
      if (before.digest !== current.digest) throw new Error(`File changed since the snapshot: ${path}. Cancel and start a new review.`)
      if (!current.digest && entry.outcome !== 'uncertain') throw new Error(`Unreadable file requires an uncertain review: ${path}`)
    }
    const replacing = new Set(paths)
    pending.entries = [...pending.entries.map(entry => ({ ...entry, paths: entry.paths.filter(path => !replacing.has(path)) })).filter(entry => entry.paths.length), ...packet.entries]
    return pending
  })
}

export async function finishCoverageReview(cwd: string, id: string): Promise<CoverageReview> {
  const ctx = context(cwd)
  return mutate(ctx, async store => {
    const coverage = await readCoverage(ctx)
    // Publication can succeed before clearing pending work. Retrying must retain
    // the historical snapshot, even when current inputs have since changed.
    if (coverage?.document.review?.id === id) {
      if (store.pending?.id === id) store.pending = null
      return coverage.document.review
    }
    const pending = requirePending(store, id)
    const recorded = new Set(pending.entries.flatMap(entry => entry.paths))
    const remaining = pending.files.filter(file => !recorded.has(file.path))
    if (remaining.length) throw new Error(`${remaining.length} files still need a review. First: ${remaining[0]!.path}`)
    compileResolvedWorkspaceReport({ modelRoot: ctx.modelRoot, gitRoot: ctx.root })
    validateLinks(ctx, pending.entries)
    const modelDigest = await modelFingerprint(ctx.modelRoot)
    if (!modelDigest || !coverage) throw new Error('Create and lint the Product Model before completing its review.')
    const current = await snapshot(ctx.root, pending.policy)
    if (JSON.stringify(current) !== JSON.stringify(pending.files)) throw new Error('Repository files changed during review. Cancel and start again; the completed review has not changed.')
    if (modelDigest !== await modelFingerprint(ctx.modelRoot)) throw new Error('The Product Model changed while completing the review. Retry after authoring settles.')
    const completed = orderedReview({ ...pending, modelDigest, completedAt: new Date().toISOString() })
    await publishReview(ctx, coverage.raw, coverage.document, completed)
    store.pending = null
    return completed
  })
}

export async function cancelCoverageReview(cwd: string, id: string): Promise<{ cancelled: string }> {
  const ctx = context(cwd)
  return mutate(ctx, async store => {
    requirePending(store, id)
    store.pending = null
    return { cancelled: id }
  })
}

export async function coverageStatus(cwd: string, modelRoot?: string): Promise<CoverageComparison> {
  const ctx = context(cwd, modelRoot)
  const baseline = (await readCoverage(ctx))?.document.review ?? null
  const { pending } = await readStore(ctx)
  const policy: CoverageReviewPolicy = baseline?.policy ?? pending?.policy ?? { version: 'project-files-v1', includePaths: [] }
  const current = await snapshot(ctx.root, policy)
  const before = new Map(baseline?.files.map(file => [file.path, file]) ?? [])
  const now = new Map(current.map(file => [file.path, file]))
  const paths = [...new Set([...before.keys(), ...now.keys()])].sort()
  const files = await parallelMap(paths, async path => {
    const previous = before.get(path)
    const present = now.get(path)
    if (!present) {
      try {
        await safeParents(ctx.root, path)
        await lstat(join(ctx.root, path))
        return { path, change: 'outside-policy' as const }
      } catch { return { path, change: 'deleted' as const } }
    }
    if (!present.digest) return { path, change: 'unreadable' as const, error: present.error }
    if (!baseline) return { path, change: 'unreviewed' as const }
    if (!previous) return { path, change: 'added' as const }
    if (!previous.digest) return { path, change: 'modified' as const }
    return { path, change: previous.digest === present.digest ? 'unchanged' as const : 'modified' as const }
  })
  const pendingCurrent = pending && JSON.stringify(pending.policy) !== JSON.stringify(policy) ? await snapshot(ctx.root, pending.policy) : current
  return { policy, baseline, pending, files, modelChanged: baseline ? baseline.modelDigest !== await modelFingerprint(ctx.modelRoot) : null,
    pendingChanged: pending ? JSON.stringify(pending.files) !== JSON.stringify(pendingCurrent) : null }
}

export async function repositoryContext(root: string, includeIgnored: boolean, modelRoot = root): Promise<RepositoryInventory> {
  const inventory = await repositoryInventory(root, includeIgnored)
  try { return { ...inventory, coverage: await coverageStatus(root, modelRoot) } }
  catch (error) { return { ...inventory, coverageError: (error as Error).message } }
}
