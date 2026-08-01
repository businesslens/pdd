import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as sdk from '../src/report.js'
import { reportDigest } from '../src/report-digest.js'
import { compileReport } from '../src/commands/export.js'
import { lsFiles } from '../src/core/git.js'
import { loadModel } from '../src/core/model.js'
import { resolveModelRoot } from '../src/core/model-root.js'
import type { ProductReportV4 } from '../src/core/portable.js'

const packageJson = JSON.parse(
  await readFile(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')
) as { exports?: Record<string, unknown>, dependencies?: Record<string, string> }

/**
 * `businesslens/report` is a published cross-repository contract: BusinessLens
 * Platform imports it instead of vendoring its own copy of the schema. These
 * tests guard the shape of that contract.
 */
describe('report SDK entry point', () => {
  it('is exposed as the ./report and ./report/digest subpath exports', () => {
    expect(packageJson.exports?.['./report']).toEqual({
      types: './dist/report.d.ts',
      default: './dist/report.js'
    })
    expect(packageJson.exports?.['./report/digest']).toEqual({
      types: './dist/report-digest.d.ts',
      default: './dist/report-digest.js'
    })
  })

  it('exports the schema, the semantic validator, and the canonical digest', () => {
    expect(sdk.REPORT_SCHEMA_VERSION).toBe('4.0.0')
    expect(sdk.SUBMISSION_SCHEMA_VERSION).toBe('1.0.0')
    for (const name of [
      'ProductReportV4Schema',
      'ProjectSubmissionV4Schema',
      'SubmissionProvenanceSchema',
      'validateProductReport',
      'parseProductReport',
      'redactSourceEvidence',
      'canonicalReportJson'
    ]) {
      expect(sdk, `missing export ${name}`).toHaveProperty(name)
    }
  })

  it('never pulls the CLI or its dependencies into the library graph', async () => {
    const seen = new Set<string>()
    const external = new Set<string>()
    const entry = fileURLToPath(new URL('../src/report.ts', import.meta.url))

    async function walk(file: string): Promise<void> {
      if (seen.has(file)) return
      seen.add(file)
      const source = await readFile(file, 'utf8')
      for (const match of source.matchAll(/from\s+'([^']+)'/g)) {
        const specifier = match[1]!
        if (!specifier.startsWith('.')) {
          external.add(specifier)
          continue
        }
        await walk(fileURLToPath(new URL(specifier.replace(/\.js$/, '.ts'), `file://${file}`)))
      }
    }
    await walk(entry)

    // Browser bundles import this entry, so it must stay free of Node built-ins.
    expect([...external].sort()).toEqual(['zod'])
    expect([...seen].some(file => file.includes('/commands/'))).toBe(false)
    // Everything the library graph imports must be a declared runtime dependency.
    for (const specifier of external) {
      if (specifier.startsWith('node:')) continue
      expect(packageJson.dependencies).toHaveProperty(specifier)
    }
  })

  it('computes a key-order-independent digest from the digest entry', () => {
    const digest = reportDigest({ b: 1, a: [{ d: 2, c: 3 }] })
    expect(reportDigest({ a: [{ c: 3, d: 2 }], b: 1 })).toBe(digest)
    expect(sdk.canonicalReportJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}')
  })
})

/**
 * A Product Model Version keeps full evidence inside its owning workspace.
 * Anything delivered outside that workspace — a download or a public Hub
 * report — goes through this projection first.
 */
describe('redactSourceEvidence', () => {
  const FIXTURE = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures', 'fixture-shop')
  let repo: string
  let report: ProductReportV4

  const allCodeRefs = (value: ProductReportV4) =>
    Object.values(value.model).flatMap(entry =>
      Array.isArray(entry) ? entry.flatMap(item => item.codeRefs ?? []) : [])

  beforeAll(() => {
    repo = mkdtempSync(join(tmpdir(), 'bl-redact-'))
    cpSync(FIXTURE, repo, { recursive: true })
    const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' })
    git('init', '--initial-branch=main')
    git('config', 'user.email', 'fixture@example.com')
    git('config', 'user.name', 'Fixture')
    git('remote', 'add', 'origin', 'https://github.com/example/fixture-shop.git')
    git('add', '.')
    git('commit', '-m', 'fixture')
    // Deliberately the unredacted compiler output: `buildProject` now redacts
    // before writing, so it would hand these tests nothing left to remove.
    const { modelRoot } = resolveModelRoot(repo)
    report = compileReport(loadModel(modelRoot), lsFiles(repo).length, '2026-01-01')
  })

  afterAll(() => {
    rmSync(repo, { recursive: true, force: true })
  })

  it('removes every source path and symbol from the delivered report', () => {
    expect(allCodeRefs(report).length).toBeGreaterThan(0)
    const redacted = sdk.redactSourceEvidence(report)

    expect(allCodeRefs(redacted)).toEqual([])
    expect(JSON.stringify(redacted)).not.toContain('src/services/payments.ts')
    expect(JSON.stringify(redacted)).not.toContain('PaymentGateway.charge')
    expect(redacted.coverage.evidenceRedacted).toBe(true)
  })

  /**
   * `codeRefs` are not the only field that structurally names the repository:
   * journey entry points, SDD links, and coverage source areas do too. This
   * walks the whole delivered document rather than trusting a field list.
   */
  it('leaves no repository-relative path anywhere in the delivered document', () => {
    const repositoryPaths = (value: unknown, path = 'report'): string[] => {
      if (typeof value === 'string') {
        return /(?:^|["\s(])(?:\.{1,2}\/|src\/|test\/|lib\/|app\/|openspec\/)/.test(value)
          ? [`${path}: ${value}`]
          : []
      }
      if (Array.isArray(value)) {
        return value.flatMap((item, index) => repositoryPaths(item, `${path}[${index}]`))
      }
      if (value && typeof value === 'object') {
        return Object.entries(value).flatMap(([key, item]) => repositoryPaths(item, `${path}.${key}`))
      }
      return []
    }

    // The unredacted report is where that evidence legitimately lives.
    expect(repositoryPaths(report).length).toBeGreaterThan(0)
    expect(repositoryPaths(sdk.redactSourceEvidence(report))).toEqual([])
  })

  it('drops repository entry points and links but keeps product-facing ones', () => {
    const withLinks = structuredClone(report)
    withLinks.model.actors[0]!.links = [
      { rel: 'spec', href: 'openspec/specs/checkout/spec.md', title: 'Local spec' },
      { rel: 'doc', href: 'README.md', title: 'Local root doc' },
      { rel: 'doc', href: '/Users/owner/project/README.md', title: 'Absolute local doc' },
      { rel: 'doc', href: String.raw`C:\workspace\project\README.md`, title: 'Windows local doc' },
      { rel: 'doc', href: 'file:///Users/owner/project/README.md', title: 'Local file URL' },
      { rel: 'doc', href: 'https://example.com/handbook', title: 'Public doc' }
    ]
    withLinks.model.journeys[0]!.entryPoints = [
      { type: 'posix-relative', path: 'src/routes/storefront.ts' },
      { type: 'windows-relative', path: String.raw`src\routes\storefront.ts` },
      { type: 'windows-absolute', path: String.raw`C:\workspace\src\routes\storefront.ts` },
      { type: 'unc', path: String.raw`\\server\share\storefront.ts` },
      { type: 'file-url', path: 'file:///Users/owner/project/src/routes/storefront.ts' },
      { type: 'posix-absolute', path: '/Users/owner/project/src/routes/storefront.ts' },
      { type: 'route', path: '/checkout' },
      { type: 'url', path: 'https://example.com/checkout' },
      { type: 'cli', path: 'businesslens build' }
    ]
    const redacted = sdk.redactSourceEvidence(withLinks)

    expect(redacted.model.actors[0]!.links).toEqual([
      { rel: 'doc', href: 'https://example.com/handbook', title: 'Public doc' }
    ])
    // Experiences reach actors through real routes; those stay.
    expect(redacted.model.experiences.flatMap(item => item.entryPoints.map(point => point.path)))
      .toEqual(expect.arrayContaining(['/']))
    expect(redacted.model.journeys[0]!.entryPoints).toEqual([
      { type: 'route', path: '/checkout' },
      { type: 'url', path: 'https://example.com/checkout' },
      { type: 'cli', path: 'businesslens build' }
    ])
    expect(redacted.coverage.sourceAreas).toEqual([])
  })

  it('rejects a redacted report that still names repository paths', () => {
    const base = sdk.redactSourceEvidence(report)

    for (const path of [
      'src/routes/storefront.ts',
      String.raw`src\routes\storefront.ts`,
      String.raw`C:\workspace\src\routes\storefront.ts`,
      String.raw`\\server\share\storefront.ts`,
      'file:///Users/owner/project/src/routes/storefront.ts',
      '/Users/owner/project/src/routes/storefront.ts'
    ]) {
      const withEntryPoint = structuredClone(base)
      withEntryPoint.model.journeys[0]!.entryPoints = [{ type: 'web', path }]
      expect(sdk.validateProductReport(withEntryPoint).join('\n'))
        .toContain(`still exposes the repository entry point "${path}"`)
    }

    const withLink = structuredClone(base)
    withLink.model.actors[0]!.links = [{ rel: 'spec', href: '/local/spec.md' }]
    expect(sdk.validateProductReport(withLink).join('\n'))
      .toContain('still exposes the repository link "/local/spec.md"')

    const withSourceAreas = structuredClone(base)
    withSourceAreas.coverage.sourceAreas = ['src']
    expect(sdk.validateProductReport(withSourceAreas)).toContain(
      'coverage.evidenceRedacted is true but coverage.sourceAreas names repository areas'
    )
  })

  it('leaves the source report untouched and stays idempotent', () => {
    const before = JSON.stringify(report)
    const once = sdk.redactSourceEvidence(report)
    expect(JSON.stringify(report)).toBe(before)
    expect(sdk.redactSourceEvidence(once)).toEqual(once)
  })

  it('keeps mapped coverage as an origin-repository quality signal', () => {
    const redacted = sdk.redactSourceEvidence(report)
    expect(redacted.coverage.mapped).toEqual(report.coverage.mapped)
    expect(redacted.coverage.mapped.scenarios).toBeGreaterThan(0)
    expect(redacted.coverage.counts).toEqual(report.coverage.counts)
  })

  it('still parses and validates as a Product Report', () => {
    const redacted = sdk.redactSourceEvidence(report)
    expect(sdk.validateProductReport(redacted)).toEqual([])
    expect(() => sdk.parseProductReport(JSON.parse(JSON.stringify(redacted)))).not.toThrow()
  })

  it('rejects a redacted report that still carries evidence', () => {
    const tampered = structuredClone(sdk.redactSourceEvidence(report))
    tampered.model.scenarios[0]!.codeRefs = [{ path: 'src/services/payments.ts' }]
    expect(sdk.validateProductReport(tampered)).toContain(
      'coverage.evidenceRedacted is true but entities still carry codeRefs'
    )
  })

  it('rejects redacted mapped counts that exceed the entity counts', () => {
    const tampered = structuredClone(sdk.redactSourceEvidence(report))
    tampered.coverage.mapped.scenarios = tampered.summary.scenarios + 1
    expect(sdk.validateProductReport(tampered)).toContain(
      `coverage.mapped.scenarios must be at most ${tampered.summary.scenarios}`
    )
  })

  it('keeps the exact mapped cross-check for unredacted reports', () => {
    const tampered = structuredClone(report)
    tampered.coverage.mapped.scenarios = tampered.summary.scenarios + 1
    expect(sdk.validateProductReport(tampered)).toContain(
      `coverage.mapped.scenarios must equal ${report.coverage.mapped.scenarios}`
    )
  })
})
