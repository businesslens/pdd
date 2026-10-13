import { describe, expect, it } from 'vitest'
import { invocationFor } from '../src/core/invocation.js'

describe('CLI invocation for hints', () => {
  const nothing = () => false
  const everything = () => true

  it('tells one-off and project runs to use npx', () => {
    for (const root of [
      '/Users/a/.npm/_npx/0123abcd/node_modules/pdd-toolkit',
      '/Users/a/Library/Caches/pnpm/dlx/abc/node_modules/.pnpm/pdd-toolkit@1.0.0/node_modules/pdd-toolkit',
      '/private/tmp/bunx-501-pdd-toolkit@latest/node_modules/pdd-toolkit',
      '/work/app/node_modules/pdd-toolkit',
      'C:\\Users\\a\\AppData\\Local\\npm-cache\\_npx\\0123\\node_modules\\pdd-toolkit'
    ]) {
      expect(invocationFor(root, 'darwin', everything), root).toBe('npx pdd-toolkit')
    }
  })

  it('uses the bare command where a global install put it on PATH', () => {
    expect(invocationFor('/usr/local/lib/node_modules/pdd-toolkit', 'darwin', everything)).toBe('pdd-kit')
    expect(invocationFor('/Users/a/Library/pnpm/global/5/node_modules/pdd-toolkit', 'darwin', nothing)).toBe('pdd-kit')
  })

  it('does not trust a global-looking path whose command is missing', () => {
    expect(invocationFor('/usr/local/lib/node_modules/pdd-toolkit', 'darwin', nothing)).toBe('npx pdd-toolkit')
  })

  it('uses the bare command from a linked source checkout', () => {
    expect(invocationFor('/Users/a/code/pdd-kit', 'darwin', nothing)).toBe('pdd-kit')
  })
})
