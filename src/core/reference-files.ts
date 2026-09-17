import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { closeSync, constants, fstatSync, lstatSync, openSync, readSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import type { ProductReportV16 } from './portable.js'
import { excludedReferencePath, reportReferencePaths, type ReferenceFileSnapshot, type ReportReferenceFiles } from './report-reference-files.js'

export const MAX_REFERENCE_BYTES = 25 * 1024 * 1024
export const MAX_REFERENCE_TEXT_BYTES = 256 * 1024

const unavailable = (reason: string): ReferenceFileSnapshot => ({ status: 'unavailable', reason })

function fingerprint(body: Buffer): ReferenceFileSnapshot {
  let text: string | null = null
  let omitted: 'binary' | 'large' | null = body.length > MAX_REFERENCE_TEXT_BYTES ? 'large' : null
  if (!omitted) {
    try {
      text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(body)
      if (text.includes('\0')) { text = null; omitted = 'binary' }
    } catch { omitted = 'binary' }
  }
  return { status: 'present', digest: createHash('sha256').update(body).digest('hex'), bytes: body.length, text, omitted }
}

/** Cache bytes until stat changes; recheck every path component before reuse. */
export function createReferenceFileSource(root: string): (report: ProductReportV16) => ReportReferenceFiles {
  const base = realpathSync(root)
  let cache = new Map<string, { stamp: string, value: ReferenceFileSnapshot }>()
  return (report) => {
    const next = new Map<string, { stamp: string, value: ReferenceFileSnapshot }>()
    const files: ReportReferenceFiles = Object.create(null)
    for (const path of reportReferencePaths(report)) {
      if (excludedReferencePath(path)) {
        files[path] = unavailable('Git and generated BusinessLens files are not captured.')
        continue
      }
      let descriptor: number | undefined
      try {
        const parts = path.split('/')
        let file = base
        for (const [index, part] of parts.entries()) {
          file = join(file, part)
          const stat = lstatSync(file)
          if (stat.isSymbolicLink()) throw new Error('Symbolic links are not captured.')
          if (index < parts.length - 1 && !stat.isDirectory()) throw new Error('A parent path is not a directory.')
        }
        const stat = lstatSync(file)
        if (!stat.isFile()) throw new Error('The Reference does not name a regular file.')
        if (stat.size > MAX_REFERENCE_BYTES) throw new Error('File exceeds the 25 MiB comparison limit.')
        const stamp = [stat.dev, stat.ino, stat.mode, stat.size, stat.mtimeMs, stat.ctimeMs].join(':')
        const cached = cache.get(path)
        if (cached?.stamp === stamp) {
          files[path] = cached.value
          next.set(path, cached)
          continue
        }
        descriptor = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
        const opened = fstatSync(descriptor)
        if (!opened.isFile() || opened.size > MAX_REFERENCE_BYTES) throw new Error('File cannot be captured within the comparison limit.')
        // Bound the read even if another process grows the file after stat.
        const body = Buffer.allocUnsafe(opened.size + 1)
        let length = 0
        while (length < body.length) {
          const count = readSync(descriptor, body, length, body.length - length, length)
          if (!count) break
          length += count
        }
        const finished = fstatSync(descriptor)
        if (length !== opened.size || finished.mtimeMs !== opened.mtimeMs || finished.ctimeMs !== opened.ctimeMs) {
          throw new Error('File changed while being captured; it will be checked again.')
        }
        const value = fingerprint(body.subarray(0, length))
        files[path] = value
        next.set(path, { stamp, value })
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code
        files[path] = code === 'ENOENT' || code === 'ENOTDIR'
          ? { status: 'missing' }
          : unavailable(code ? `File could not be read (${code}).` : (error as Error).message)
      } finally {
        if (descriptor !== undefined) closeSync(descriptor)
      }
    }
    cache = next
    return files
  }
}

/** Read blobs by object id so every file belongs to the same pinned commit. */
export function committedReferenceFiles(root: string, commit: string, report: ProductReportV16): ReportReferenceFiles {
  const listing = spawnSync('git', ['-C', root, 'ls-tree', '-rlz', commit], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (listing.status !== 0) throw new Error('Could not list committed Reference files.')
  const entries = new Map<string, { mode: string, oid: string, bytes: number }>()
  for (const entry of listing.stdout.split('\0')) {
    const tab = entry.indexOf('\t')
    if (tab < 0) continue
    const [mode, , oid, size] = entry.slice(0, tab).trim().split(/\s+/)
    if (mode && oid) entries.set(entry.slice(tab + 1), { mode, oid, bytes: Number(size) })
  }
  const files: ReportReferenceFiles = Object.create(null)
  for (const path of reportReferencePaths(report)) {
    const entry = entries.get(path)
    if (excludedReferencePath(path)) files[path] = unavailable('Git and generated BusinessLens files are not captured.')
    else if (!entry) files[path] = { status: 'missing' }
    else if (entry.mode !== '100644' && entry.mode !== '100755') files[path] = unavailable('The committed Reference is not a regular file.')
    else if (entry.bytes > MAX_REFERENCE_BYTES) files[path] = unavailable('File exceeds the 25 MiB comparison limit.')
    else {
      const blob = spawnSync('git', ['-C', root, 'cat-file', 'blob', entry.oid], { maxBuffer: MAX_REFERENCE_BYTES + 1024 })
      files[path] = blob.status === 0 ? fingerprint(blob.stdout) : unavailable('Committed file could not be read.')
    }
  }
  return files
}
