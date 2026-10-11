import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { faqProblems } from '../scripts/faq.mjs'

const source = readFileSync(new URL('../docs/faq.md', import.meta.url), 'utf8')

describe('standalone FAQ document', () => {
  it('accepts the authored FAQ', async () => {
    expect(await faqProblems(source)).toEqual([])
  })

  it('rejects answers outside a group and empty questions', async () => {
    expect(await faqProblems(source.replace('<a name="adopting-it"></a>', ''))).not.toEqual([])
    expect(await faqProblems(source.replace('### Why a structured format', '### Empty question?\n\n### Why a structured format')))
      .toContain('docs/faq.md: missing answer for Empty question?')
  })

  it('rejects duplicate addresses and unsupported blocks instead of dropping them', async () => {
    expect(await faqProblems(source.replace('name="what-it-is"', 'name="adopting-it"')))
      .toContain('docs/faq.md: invalid or duplicate group anchor adopting-it')
    expect((await faqProblems(source.replace('### Why a structured format', '> Hidden quote\n\n### Why a structured format')))
      .some(message => message.includes('unsupported answer block'))).toBe(true)
  })
})
