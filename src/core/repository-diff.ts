import { isUtf8 } from 'node:buffer'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { constants } from 'node:fs'
import { lstat, open, readlink } from 'node:fs/promises'
import { join } from 'node:path'
import { git } from './git.js'
import { repositoryInventory } from './repository-inventory.js'
import { MAX_REFERENCE_BYTES, MAX_REFERENCE_TEXT_BYTES } from './reference-files.js'
import { excludedReferencePath } from './report-reference-files.js'
import type { RepositoryDiff, RepositoryFileComparison, RepositoryFileReading } from './repository-diff-types.js'

interface FileIdentity { mode: string, oid?: string, bytes?: number, error?: string }
const included = (path: string) => !excludedReferencePath(path)
  && !path.split('/').some(part => part.startsWith('.businesslens.backup-'))
const validPath = (path: string) => !!path && !path.startsWith('/') && !path.includes('\\') && !path.includes('\0')
  && path.split('/').every(part => part && part !== '.' && part !== '..') && included(path)

async function parents(root: string, path: string) {
  let current = root
  for (const segment of path.split('/').slice(0, -1)) {
    current = join(current, segment)
    if ((await lstat(current)).isSymbolicLink()) throw new Error('A parent directory is a symbolic link.')
  }
}

function committedFiles(root: string, commit: string): Map<string, FileIdentity> {
  if (!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(commit)) throw new Error('Select an immutable Git commit.')
  const files = new Map<string, FileIdentity>()
  for (const entry of git(root, 'ls-tree', '-rlz', commit).split('\0')) {
    const tab = entry.indexOf('\t')
    if (tab < 0) continue
    const path = entry.slice(tab + 1)
    if (!included(path)) continue
    const [mode = '', , oid, size] = entry.slice(0, tab).trim().split(/\s+/)
    files.set(path, { mode, oid, bytes: Number(size) })
  }
  return files
}

/** Read-only inventories; Git owns saved bytes, and working identities are stat-cached. */
export function createRepositoryComparison(root: string, modelPath = '.businesslens') {
  const algorithm = git(root, 'rev-parse', '--show-object-format') === 'sha256' ? 'sha256' : 'sha1'
  const cache = new Map<string, { stamp: string, file: FileIdentity }>()
  const blob = (body: Buffer) => createHash(algorithm).update(`blob ${body.length}\0`).update(body).digest('hex')
  const stamp = (stat: Awaited<ReturnType<typeof lstat>>) => [stat.dev, stat.ino, stat.mode, stat.size, stat.mtimeMs, stat.ctimeMs].join(':')
  async function workingFile(path: string): Promise<FileIdentity> {
    try {
      await parents(root, path)
      const absolute = join(root, path)
      const stat = await lstat(absolute)
      if (stat.isSymbolicLink()) {
        const body = Buffer.from(await readlink(absolute))
        return { mode: '120000', oid: blob(body), bytes: body.length }
      }
      if (!stat.isFile()) return { mode: '160000', error: 'Submodule contents require a separate comparison.' }
      const previous = cache.get(path)
      if (previous?.stamp === stamp(stat)) return previous.file
      const handle = await open(absolute, constants.O_RDONLY | constants.O_NOFOLLOW)
      try {
        const before = await handle.stat()
        if (!before.isFile()) throw new Error('This path is not a regular file.')
        const hash = createHash(algorithm).update(`blob ${before.size}\0`)
        for await (const chunk of handle.createReadStream({ autoClose: false })) hash.update(chunk)
        if (stamp(before) !== stamp(await handle.stat()) || stamp(before) !== stamp(await lstat(absolute))) {
          throw new Error('File changed while being compared. Refresh to try again.')
        }
        const file = { mode: before.mode & 0o111 ? '100755' : '100644', oid: hash.digest('hex'), bytes: before.size }
        cache.set(path, { stamp: stamp(before), file })
        return file
      } finally { await handle.close() }
    } catch (error) { return { mode: '', error: (error as Error).message } }
  }
  async function inventory(state: string): Promise<Map<string, FileIdentity>> {
    if (state === 'empty') return new Map()
    if (state !== 'working') {
      return committedFiles(root, state.replace(/^commit:/, ''))
    }
    const paths = (await repositoryInventory(root, false)).paths.filter(included)
    const files = new Map<string, FileIdentity>()
    let next = 0
    await Promise.all(Array.from({ length: Math.min(8, paths.length) }, async () => {
      for (;;) {
        const path = paths[next++]
        if (path === undefined) return
        files.set(path, await workingFile(path))
      }
    }))
    for (const path of cache.keys()) if (!files.has(path)) cache.delete(path)
    return files
  }
  function reading(body: Buffer, mode: string): RepositoryFileReading {
    if (body.length > MAX_REFERENCE_TEXT_BYTES) return { status: 'large', bytes: body.length, mode }
    if (body.includes(0) || !isUtf8(body)) return { status: 'binary', bytes: body.length, mode }
    return { status: 'text', text: body.toString('utf8'), bytes: body.length, mode }
  }
  async function read(state: string, path: string): Promise<RepositoryFileReading> {
    try {
      if (!validPath(path)) throw new Error('This repository path cannot be read.')
      const files = await inventory(state)
      const entry = files.get(path)
      if (!entry) return { status: 'missing' }
      if (entry.error) throw new Error(entry.error)
      if (entry.mode === '160000') throw new Error('Submodule contents require a separate comparison.')
      if ((entry.bytes ?? 0) > MAX_REFERENCE_TEXT_BYTES) return { status: 'large', bytes: entry.bytes!, mode: entry.mode }
      if (state === 'working') {
        await parents(root, path)
        if (entry.mode === '120000') return reading(Buffer.from(await readlink(join(root, path))), entry.mode)
        const handle = await open(join(root, path), constants.O_RDONLY | constants.O_NOFOLLOW)
        try {
          const stat = await handle.stat()
          if (!stat.isFile()) throw new Error('This path is not a regular file.')
          if (stat.size > MAX_REFERENCE_TEXT_BYTES) return { status: 'large', bytes: stat.size, mode: entry.mode }
          const body = Buffer.alloc(stat.size + 1)
          let length = 0
          while (length < body.length) {
            const result = await handle.read(body, length, body.length - length, length)
            if (!result.bytesRead) break
            length += result.bytesRead
          }
          if (length !== stat.size || stamp(stat) !== stamp(await handle.stat())) throw new Error('File changed while being read. Refresh to try again.')
          return reading(body.subarray(0, length), entry.mode)
        } finally { await handle.close() }
      }
      const result = spawnSync('git', ['-C', root, 'cat-file', 'blob', entry.oid!], { maxBuffer: MAX_REFERENCE_BYTES + 1024 })
      if (result.status !== 0) throw new Error('The historical file could not be read.')
      return reading(result.stdout, entry.mode)
    } catch (error) { return { status: 'unavailable', reason: (error as Error).message } }
  }
  return {
    async compare(base: string, target: string): Promise<RepositoryDiff> {
      const before = await inventory(base)
      const after = base === target ? before : await inventory(target)
      const paths = [...new Set([...before.keys(), ...after.keys()])].sort()
      const files: RepositoryDiff['files'] = []
      for (const path of paths) {
        const left = before.get(path), right = after.get(path)
        if (left?.error || right?.error) files.push({ path, change: 'unavailable', reason: [left?.error, right?.error].filter(Boolean).join('; ') })
        else if (!left) files.push({ path, change: 'added', afterMode: right!.mode })
        else if (!right) files.push({ path, change: 'deleted', beforeMode: left.mode })
        else if (left.oid !== right.oid || left.mode !== right.mode) files.push({ path, change: 'modified', beforeMode: left.mode, afterMode: right.mode })
      }
      return { modelPath, paths, files }
    },
    async file(base: string, target: string, path: string): Promise<RepositoryFileComparison> {
      if (!validPath(path)) throw new Error('This repository path cannot be read.')
      const before = await read(base, path)
      return { path, before, after: base === target ? before : await read(target, path) }
    }
  }
}
