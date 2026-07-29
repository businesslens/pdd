import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as sdk from '../src/report.js'
import { reportDigest } from '../src/report-digest.js'

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
