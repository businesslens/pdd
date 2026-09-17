import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, truncateSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { compileReport } from '../src/commands/export.js'
import { compileCommittedReport } from '../src/core/committed-report.js'
import { loadModel } from '../src/core/model.js'
import { resolveModelRoot } from '../src/core/model-root.js'
import { createReferenceFileSource, MAX_REFERENCE_BYTES, MAX_REFERENCE_TEXT_BYTES } from '../src/core/reference-files.js'
import { diffIsEmpty, diffReports } from '../src/core/report-diff.js'
import { localReferencePath } from '../src/core/report-reference-files.js'

const directories: string[] = []
afterEach(() => { for (const root of directories.splice(0)) rmSync(root, { recursive: true, force: true }) })

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'bl-reference-files-'))
  directories.push(root)
  cpSync(join(__dirname, 'fixtures', 'fixture-shop'), root, { recursive: true })
  const report = compileReport(loadModel(root), '2026-09-15', root)
  const owner = report.model.capabilities[0]!
  owner.references = [{ kind: 'doc', role: 'context', target: 'notes.txt', title: 'Notes' }]
  return { root, report, owner, read: createReferenceFileSource(root), path: join(root, 'notes.txt') }
}

describe('local Reference files', () => {
  it('resolves code suffixes and excludes remote or escaping targets', () => {
    expect(localReferencePath({ kind: 'code', target: 'src/orders.ts#Order.submit:2-8' })).toBe('src/orders.ts')
    expect(localReferencePath({ kind: 'doc', target: './notes.txt' })).toBe('notes.txt')
    expect(localReferencePath({ kind: 'doc', target: '~notes.txt' })).toBe('~notes.txt')
    for (const target of ['https://example.com/file', '../outside.txt', '/absolute.txt', 'file:///secret', 'C:\\secret.txt']) {
      expect(localReferencePath({ kind: 'doc', target })).toBeUndefined()
    }
  })

  it('marks the owning resource when only a file changes, and deduplicates code suffixes', () => {
    const { root, report, owner, read, path } = fixture()
    owner.references.push({ kind: 'code', role: 'implementation', target: 'notes.txt#Notes:1' })
    writeFileSync(path, 'before\n')
    const before = read(report)
    writeFileSync(join(root, 'unrelated.txt'), 'unrelated')
    expect(diffIsEmpty(diffReports(report, report, { before, after: read(report) }))).toBe(true)
    writeFileSync(path, 'after\n')
    const changed = diffReports(report, report, { before, after: read(report) })
    expect(changed.counts).toEqual({ added: 0, removed: 0, changed: 1 })
    expect(changed.resources[0]!.id).toBe(owner.id)
    expect(changed.resources[0]!.fields).toEqual([{
      field: 'references["notes.txt"].file', referenceFile: 'notes.txt', change: 'changed', before: 'before\n', after: 'after\n'
    }])
  })

  it('compares Product References and distinguishes missing files from unknown history', () => {
    const { report, read, path } = fixture()
    report.references = [{ kind: 'doc', role: 'context', target: 'notes.txt' }]
    const missing = read(report)
    writeFileSync(path, 'created')
    const present = read(report)
    expect(diffReports(report, report, { before: missing, after: present }).product[0]).toMatchObject({ change: 'added', before: null, after: 'created' })
    rmSync(path)
    expect(diffReports(report, report, { before: present, after: read(report) }).product[0]).toMatchObject({ change: 'removed', before: 'created', after: null })
    expect(diffIsEmpty(diffReports(report, report, { before: {}, after: present }))).toBe(true)
    const attached = structuredClone(report)
    attached.model.capabilities[0]!.references = []
    expect(diffReports(attached, report, { before: missing, after: present }).resources[0]!.fields.every(field => !field.referenceFile)).toBe(true)
  })

  it('detects same-size binary edits and bounds previews and file reads', () => {
    const { report, read, path } = fixture()
    writeFileSync(path, Buffer.from([0, 1, 2]))
    const before = read(report)
    writeFileSync(path, Buffer.from([0, 1, 3]))
    const after = read(report)
    const change = diffReports(report, report, { before, after }).resources[0]!.fields[0]!
    expect(change.before).toContain('Binary file')
    expect(change.after).not.toBe(change.before)
    expect(after['notes.txt']).toMatchObject({ status: 'present', text: null, omitted: 'binary' })
    writeFileSync(path, 'x'.repeat(MAX_REFERENCE_TEXT_BYTES + 1))
    expect(read(report)['notes.txt']).toMatchObject({ status: 'present', text: null, omitted: 'large' })
    truncateSync(path, MAX_REFERENCE_BYTES + 1)
    expect(read(report)['notes.txt']).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('25 MiB') })
  })

  it.skipIf(process.platform === 'win32')('refuses leaf and parent symlinks, directories and generated history', () => {
    const { root, report, owner, read, path } = fixture()
    const outside = mkdtempSync(join(tmpdir(), 'bl-reference-outside-'))
    directories.push(outside)
    writeFileSync(join(outside, 'secret.txt'), 'must not be captured')
    symlinkSync(join(outside, 'secret.txt'), path)
    symlinkSync(outside, join(root, 'linked'))
    owner.references.push(
      { kind: 'doc', role: 'context', target: 'linked/secret.txt' },
      { kind: 'doc', role: 'context', target: '.businesslens/cache/checkpoints/any.json' },
      { kind: 'doc', role: 'context', target: '.GIT/config' },
      { kind: 'doc', role: 'context', target: 'src' }
    )
    const snapshot = read(report)
    for (const target of ['notes.txt', 'linked/secret.txt', '.businesslens/cache/checkpoints/any.json', '.GIT/config', 'src']) {
      expect(snapshot[target]).toMatchObject({ status: 'unavailable' })
    }
    expect(JSON.stringify(snapshot)).not.toContain('must not be captured')
  })

  it('reads committed Reference files from the Git root of a nested model', { timeout: 30_000 }, () => {
    const { root } = fixture()
    const nested = join(root, 'models', 'shop')
    mkdirSync(nested, { recursive: true })
    renameSync(join(root, '.businesslens'), join(nested, '.businesslens'))
    const git = (...args: string[]) => execFileSync('git', args, { cwd: root, stdio: 'pipe' })
    git('init', '--initial-branch=main')
    git('config', 'user.email', 'fixture@example.com')
    git('config', 'user.name', 'Fixture')
    git('add', '.')
    git('commit', '-m', 'nested model')
    const path = 'src/services/catalog.ts'
    const original = readFileSync(join(root, path), 'utf8')
    writeFileSync(join(root, path), '// working tree\n')
    const baseline = compileCommittedReport(resolveModelRoot(nested))
    expect(baseline.referenceFiles?.[path]).toMatchObject({ status: 'present', text: original })

  })
})
