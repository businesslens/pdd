import { describe, expect, it } from 'vitest'
import type { MinimarkNode } from '@nuxt/content'
import { readFaqContent } from '../../shared/faq-content'

function document(answer: MinimarkNode[]): { value: MinimarkNode[] } {
  return { value: [
    ['h1', {}, 'FAQ'],
    ['p', {}, ['a', { name: 'getting-started' }]],
    ['h2', {}, 'Getting started'],
    ['p', {}, 'How to begin.'],
    ['h3', {}, 'Where do I start?'],
    ...answer,
    ['h2', {}, 'Still have a question?'],
    ['p', {}, 'Contact us.'],
    ['ul', {},
      ['li', {}, ['a', { href: 'https://pdd-kit.dev/contact' }, 'Contact us']],
      ['li', {}, ['a', { href: 'https://pdd-kit.dev/docs' }, 'Read the docs']]]
  ] }
}

function table(headers: string[], rows: MinimarkNode[][]): MinimarkNode {
  return ['table', {},
    ['thead', {}, ['tr', {}, ...headers.map(header => ['th', {}, header] as MinimarkNode)]],
    ['tbody', {}, ...rows.map(row => ['tr', {}, ...row.map(cell => ['td', {}, cell])] as MinimarkNode)]]
}

describe('FAQ Markdown projection', () => {
  it('preserves emphasis, commands, group anchors and link destinations', () => {
    const faq = readFaqContent(document([
      ['p', {}, 'Use ', ['strong', {}, 'your agent'], ' and ', ['a', { href: './cli-view.md#usage' }, 'view'], '.'],
      ['pre', { code: 'npx @itai-gendler/pdd-kit view\n', language: 'sh' }],
      ['p', {}, ['a', { href: 'https://pdd-kit.dev/docs/references' }, 'References']],
      ['p', {}, ['a', { href: 'https://github.com/itai-gendler/pdd-kit/issues' }, 'Help']],
      ['p', {}, ['a', { href: './index' }, 'Introduction']]
    ]), 'FAQ')
    expect(faq.groups[0]?.id).toBe('getting-started')
    expect(faq.groups[0]?.questions[0]?.answer).toEqual([
      [{ text: 'Use ' }, { text: 'your agent', bold: true }, { text: ' and ' }, { text: 'view', to: '/docs/cli-view#usage' }, { text: '.' }],
      [{ text: 'npx @itai-gendler/pdd-kit view', code: true }],
      [{ text: 'References', to: '/docs/references', external: true }],
      [{ text: 'Help', to: 'https://github.com/itai-gendler/pdd-kit/issues', external: true }],
      [{ text: 'Introduction', to: '/docs' }]
    ])
    expect(faq.cta.primary).toEqual({ label: 'Contact us', to: '/contact' })
    expect(faq.cta.secondary.to).toBe('/docs')
  })

  it('projects comparison captions and row labels', () => {
    const faq = readFaqContent(document([
      ['p', {}, 'Different jobs.'], ['p', {}, ['em', {}, 'Comparison']],
      table(['', 'PRD', 'Product Model'], [['Job', 'Decide', 'Define']]),
      ['p', {}, 'Both are useful.']
    ]), 'FAQ')
    expect(faq.groups[0]?.questions[0]?.comparison).toEqual({
      lead: 'Different jobs.', caption: 'Comparison', columns: ['PRD', 'Product Model'],
      rows: [{ label: 'Job', values: ['Decide', 'Define'] }]
    })
  })

  it('projects paired boundary lists and highlighted source rows', () => {
    const boundary = readFaqContent(document([
      ['p', {}, 'Where the model stops.'],
      table(['In the model', 'Left to design'], [['Behavior', 'Colors']]),
      ['p', {}, 'Keep the distinction.']
    ]), 'FAQ').groups[0]?.questions[0]?.boundary
    expect(boundary?.kept).toEqual({ label: 'In the model', items: ['Behavior'] })
    expect(boundary?.left).toEqual({ label: 'Left to design', items: ['Colors'] })
    const stack = readFaqContent(document([
      ['p', {}, 'Each source has a job.'], ['p', {}, ['em', {}, 'Sources']],
      table(['Information source', 'Goal'], [[['strong', {}, 'Product Model'], 'Define']]),
      ['p', {}, 'Read together.']
    ]), 'FAQ').groups[0]?.questions[0]?.stack
    expect(stack?.layers).toEqual([{ label: 'Product Model', description: 'Define', highlight: true }])
  })

  it('rejects missing answers, unsupported blocks and unsafe links', () => {
    expect(() => readFaqContent(document([]), 'FAQ')).toThrow('missing answer')
    expect(() => readFaqContent(document([['blockquote', {}, 'Lost content']]), 'FAQ')).toThrow('unsupported answer block')
    expect(() => readFaqContent(document([['p', {}, ['a', { href: 'javascript:alert(1)' }, 'Click']]]), 'FAQ')).toThrow('unsupported link')
  })

  it('rejects duplicate group anchors and trailing content', () => {
    const doc = document([['p', {}, 'Answer.']])
    doc.value.splice(6, 0, ...doc.value.slice(1, 6))
    expect(() => readFaqContent(doc, 'FAQ')).toThrow('duplicate group anchor')
    const trailing = document([['p', {}, 'Answer.']])
    trailing.value.push(['p', {}, 'Unrendered content'])
    expect(() => readFaqContent(trailing, 'FAQ')).toThrow('exactly two links')
  })
})
