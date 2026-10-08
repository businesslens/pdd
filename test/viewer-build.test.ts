import { execFileSync } from 'node:child_process'
import { chmodSync, cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { buildViewerReport } from '../src/commands/export.js'
import { failureIssue, issuesAsRequest, modelIssue, resourceKeyForModelPath } from '../src/core/model-issues.js'

const FIXTURE = join(__dirname, 'fixtures', 'fixture-shop')
const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) {
    try { chmodSync(join(directory, '.businesslens', 'entities', 'cart.md'), 0o644) } catch { /* Not changed. */ }
    rmSync(directory, { recursive: true, force: true })
  }
})

/** The fixture at the root of its own repository, as `businesslens view` finds it. */
function repository(): string {
  const root = mkdtempSync(join(tmpdir(), 'bl-viewer-build-'))
  directories.push(root)
  cpSync(FIXTURE, root, { recursive: true })
  execFileSync('git', ['init', '-q'], { cwd: root })
  execFileSync('git', ['add', '-A'], { cwd: root })
  return root
}

const file = (root: string, path: string) => join(root, '.businesslens', path)
function edit(root: string, path: string, from: string, to: string) {
  const text = readFileSync(file(root, path), 'utf8')
  expect(text).toContain(from)
  writeFileSync(file(root, path), text.replace(from, to))
}
const build = (root: string) => buildViewerReport({ modelRoot: root, gitRoot: root })
const errors = (root: string) => build(root).issues.filter(issue => issue.severity === 'error')

describe('the local viewer build', () => {
  it('builds a clean model with no issues', () => {
    const result = build(repository())
    expect(result.report?.id).toBe('fixture-shop')
    expect(result.issues).toEqual([])
  })

  it('still builds when the only errors are housekeeping', () => {
    const root = repository()
    rmSync(file(root, 'README.md'))
    const result = build(root)
    expect(result.report).toBeDefined()
    expect(result.issues).toEqual([{ severity: 'error', message: 'README.md is missing', file: 'README.md' }])
  })

  it('builds a model whose loader dropped part of a file, and marks that resource incomplete', () => {
    const root = repository()
    edit(root, 'entities/cart.md', 'relations:\n', 'relations: [oops\n')
    const result = build(root)
    expect(result.report?.model.entities.find(entity => entity.id === 'cart')?.domainId ?? null).toBeNull()
    const [issue] = errors(root)
    expect(issue).toMatchObject({
      file: 'entities/cart.md',
      resource: 'entity:cart',
      incomplete: true,
      line: 2,
      column: 13
    })
    expect(issue!.message).toMatch(/^Frontmatter YAML failed to parse \(.+\)$/)
    expect(issue!.excerpt?.map(row => row.line)).toEqual([1, 2, 3])
    expect(issue!.excerpt?.[1]?.text).toBe('relations: [oops')
  })

  it('has no report when the compiler refuses the model, and lists lint’s errors rather than the refusal', () => {
    const root = repository()
    edit(root, 'capabilities/place-order/capability.md', 'domain: ordering', 'domain: orderng')
    const result = build(root)
    expect(result.report).toBeUndefined()
    expect(result.issues).toEqual([{
      severity: 'error',
      message: 'References missing domain "orderng"',
      file: 'capabilities/place-order/capability.md',
      resource: 'capability:place-order'
    }])
  })

  it('lists every error a single mistake causes', () => {
    const root = repository()
    rmSync(file(root, 'entities/refund.md'))
    const result = build(root)
    expect(result.report).toBeUndefined()
    expect(errors(root).length).toBeGreaterThan(10)
    expect(new Set(errors(root).map(issue => issue.file)).size).toBeGreaterThan(10)
  })

  it.skipIf(process.getuid?.() === 0)('turns an unreadable file into one issue instead of an exception', () => {
    const root = repository()
    chmodSync(file(root, 'entities/cart.md'), 0o000)
    const result = build(root)
    expect(result.report).toBeUndefined()
    expect(result.issues).toEqual([{
      severity: 'error',
      message: 'This file can\'t be read (permission denied).',
      file: 'entities/cart.md',
      resource: 'entity:cart'
    }])
  })

  it('reports warnings without blocking or degrading the report', () => {
    const root = repository()
    rmSync(file(root, 'capabilities/refund-order'), { recursive: true })
    const result = build(root)
    expect(result.report).toBeDefined()
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues.every(issue => issue.severity === 'warning')).toBe(true)
  })
})

describe('model issues', () => {
  const root = '/work/shop'
  const at = (text: string) => modelIssue(text, 'error', root)

  it('splits the file from the message and keeps sentences whole', () => {
    expect(at('/work/shop/.businesslens/entities/cart.md: missing H1 title')).toEqual({
      severity: 'error', message: 'Missing H1 title', file: 'entities/cart.md', resource: 'entity:cart'
    })
    expect(at('config.yaml is missing')).toEqual({ severity: 'error', message: 'config.yaml is missing', file: 'config.yaml' })
    expect(at('capabilities/half-done/ is missing capability.md')).toMatchObject({
      file: 'capabilities/half-done/', incomplete: true
    })
    expect(at('Something without a file')).toEqual({ severity: 'error', message: 'Something without a file' })
  })

  it('keeps a message that opens with a field name as written', () => {
    expect(at('/work/shop/.businesslens/business-rules/x.md: appliesTo item 1: references missing entity "refund"').message)
      .toBe('appliesTo item 1: references missing entity "refund"')
  })

  it('names the resource every model path defines', () => {
    expect(resourceKeyForModelPath('entities/cart.md')).toBe('entity:cart')
    expect(resourceKeyForModelPath('capabilities/place-order/capability.md')).toBe('capability:place-order')
    expect(resourceKeyForModelPath('capabilities/place-order/scenarios/complete-checkout.md')).toBe('capability-scenario:complete-checkout')
    expect(resourceKeyForModelPath('journeys/browse-and-buy/journey.md')).toBe('journey:browse-and-buy')
    expect(resourceKeyForModelPath('business-rules/orders-are-never-deleted.md')).toBe('rule:orders-are-never-deleted')
    expect(resourceKeyForModelPath('interfaces/operator-cli.md')).toBe('interface:operator-cli')
    expect(resourceKeyForModelPath('interfaces/admin-web/screens/order-detail.md')).toBe('screen:admin-web::order-detail')
    expect(resourceKeyForModelPath('interfaces/customer-web/experiences/storefront/experience.md')).toBe('experience:customer-web::storefront')
    expect(resourceKeyForModelPath('interfaces/customer-mobile/experiences/catalog-preview.md')).toBe('experience:customer-mobile::catalog-preview')
    expect(resourceKeyForModelPath('interfaces/customer-web/experiences/storefront/screens/product-record.md')).toBe('screen:customer-web::storefront::product-record')
    expect(resourceKeyForModelPath('product/product.md')).toBeUndefined()
    expect(resourceKeyForModelPath('capabilities/notes.txt')).toBeUndefined()
  })

  it('describes a failure that is not a lint finding', () => {
    expect(failureIssue('File watching failed: EMFILE')).toEqual({ severity: 'error', message: 'File watching failed: EMFILE' })
  })

  it('phrases the errors as a request for an agent', () => {
    const request = issuesAsRequest([
      { severity: 'error', message: 'Frontmatter YAML failed to parse', file: 'entities/cart.md', line: 2 },
      { severity: 'error', message: 'README.md is missing', file: 'README.md' },
      { severity: 'warning', message: 'No Step leaves it in "Refunded"', file: 'entities/order.md' }
    ])
    expect(request).toBe('The BusinessLens Product Model in .businesslens/ has 2 errors that `businesslens lint` reports. Fix them so the model lints clean:\n\n- entities/cart.md (line 2): Frontmatter YAML failed to parse\n- README.md is missing\n')
  })
})
