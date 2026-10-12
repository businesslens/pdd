import type { MinimarkElement, MinimarkNode } from '@nuxt/content'
import type { AnswerPart, FaqContent, Question } from './faq-types'

// The source is ordinary GitHub Markdown. This adapter gives its small set of
// structures the existing FAQ presentation; unsupported content fails visibly.
function fail(message: string): never {
  throw new Error(`docs/faq.md: ${message}`)
}

function element(node: MinimarkNode | undefined, tag?: string): node is MinimarkElement {
  return Array.isArray(node) && (!tag || node[0] === tag)
}

function children(node: MinimarkElement): MinimarkNode[] {
  return node.slice(2) as MinimarkNode[]
}

function text(node: MinimarkNode): string {
  return typeof node === 'string' ? node.replace(/\n/g, ' ') : children(node).map(text).join('')
}

function plain(node: MinimarkNode): string {
  if (element(node) && children(node).some(child => typeof child !== 'string')) {
    fail(`expected plain text in ${node[0]}`)
  }
  return text(node)
}

function link(href: string): { to: string, external?: boolean } {
  // Nuxt Content removes .md while parsing; unit inputs may still retain it.
  if (/^\.\/[\w-]+(?:\.md)?(?:#.*)?$/.test(href)) {
    return { to: href.replace(/^\.\//, '/docs/').replace(/\.md(?=#|$)/, '').replace(/^\/docs\/index(?=#|$)/, '/docs') }
  }
  if (!/^https?:\/\//.test(href)) fail(`unsupported link ${href}`)
  const url = new URL(href)
  if (url.origin === 'https://pdd-kit.dev') {
    return { to: `${url.pathname}${url.search}${url.hash}`, ...(url.pathname.startsWith('/docs/') ? { external: true } : {}) }
  }
  return { to: href, external: true }
}

function parts(node: MinimarkElement): AnswerPart[] {
  return children(node).map((child) => {
    if (typeof child === 'string') return { text: text(child) }
    if (child[0] === 'strong') return { text: plain(child), bold: true }
    if (child[0] === 'a' && typeof child[1].href === 'string') {
      return { text: plain(child), ...link(child[1].href) }
    }
    return fail(`unsupported inline element ${child[0]}`)
  })
}

function paragraph(node: MinimarkNode | undefined): MinimarkElement {
  if (!element(node, 'p')) fail('expected a paragraph')
  return node
}

function anchor(node: MinimarkNode | undefined): string | undefined {
  const candidate = element(node, 'p') && children(node).length === 1 ? children(node)[0] : node
  if (!element(candidate, 'a') || children(candidate).length || candidate[1].href) return
  const name = candidate[1].name
  if (typeof name !== 'string' || !/^[a-z][a-z0-9-]*$/.test(name)) fail('invalid group anchor')
  return name
}

function tableRows(table: MinimarkElement): MinimarkElement[][] {
  return children(table).flatMap((section) => {
    if (!element(section) || !['thead', 'tbody'].includes(section[0])) return fail('invalid table section')
    return children(section).map((row) => {
      if (!element(row, 'tr')) return fail('invalid table row')
      return children(row).map((cell) => {
        if (!element(cell) || !['th', 'td'].includes(cell[0])) return fail('invalid table cell')
        return cell
      })
    })
  })
}

function question(label: string, input: MinimarkNode[]): Question {
  const blocks = [...input]
  const result: Question = { label, answer: [] }
  const tableIndex = blocks.findIndex(node => element(node, 'table'))
  if (tableIndex !== -1) {
    if (tableIndex !== 1 && tableIndex !== 2) fail(`${label}: a table must follow its lead and optional caption`)
    const lead = plain(paragraph(blocks[0]))
    const rows = tableRows(blocks[tableIndex] as MinimarkElement)
    const headers = rows.shift()?.map(plain) ?? []
    if (!rows.length || rows.some(row => row.length !== headers.length)) fail(`${label}: empty or uneven table`)
    if (tableIndex === 1) {
      if (headers.length !== 2 || headers.some(header => !header)) fail(`${label}: boundary needs two named columns`)
      result.boundary = {
        lead,
        kept: { label: headers[0]!, items: rows.map(row => plain(row[0]!)) },
        left: { label: headers[1]!, items: rows.map(row => plain(row[1]!)) }
      }
    } else {
      const captionNode = children(paragraph(blocks[1]))
      if (captionNode.length !== 1 || !element(captionNode[0], 'em')) fail(`${label}: caption must be italic text`)
      const caption = plain(captionNode[0])
      if (headers.length === 3 && headers[0] === '' && headers[1] && headers[2]) {
        result.comparison = {
          lead, caption, columns: [headers[1], headers[2]],
          rows: rows.map(row => ({ label: plain(row[0]!), values: [plain(row[1]!), plain(row[2]!)] }))
        }
      } else if (headers.join('|') === 'Information source|Goal') {
        result.stack = {
          lead, caption,
          layers: rows.map((row) => {
            const labelParts = parts(row[0]!)
            if (labelParts.length !== 1 || labelParts[0]!.to) fail(`${label}: invalid source label`)
            return {
              label: labelParts[0]!.text, description: plain(row[1]!),
              ...(labelParts[0]!.bold ? { highlight: true } : {})
            }
          })
        }
      } else fail(`${label}: unsupported table columns`)
    }
    blocks.splice(0, tableIndex + 1)
  }
  for (const block of blocks) {
    if (element(block, 'p')) result.answer.push(parts(block))
    else if (element(block, 'pre') && typeof block[1].code === 'string') {
      result.answer.push([{ text: block[1].code.trimEnd(), code: true }])
    } else fail(`${label}: unsupported answer block`)
  }
  if (!result.answer.length) fail(`${label}: missing answer`)
  return result
}

export function readFaqContent(body: unknown, title: unknown): FaqContent {
  if (!body || typeof body !== 'object' || !('value' in body) || !Array.isArray(body.value)) fail('missing parsed body')
  if (typeof title !== 'string' || !title.trim()) fail('missing title')
  // Shiki appends generated CSS; commands use our existing CommandBlock instead.
  const nodes: MinimarkNode[] = body.value.filter(node => !element(node, 'style'))
  if (element(nodes[0], 'h1')) nodes.shift()
  const groups: FaqContent['groups'] = []
  const ids = new Set<string>()
  while (anchor(nodes[0])) {
    const id = anchor(nodes.shift())!
    if (ids.has(id)) fail(`duplicate group anchor ${id}`)
    ids.add(id)
    const heading = nodes.shift()
    if (!element(heading, 'h2')) fail(`${id}: expected group heading`)
    const group = { id, title: plain(heading), description: plain(paragraph(nodes.shift())), questions: [] as Question[] }
    const labels = new Set<string>()
    while (element(nodes[0], 'h3')) {
      const label = plain(nodes.shift()!)
      if (labels.has(label)) fail(`${id}: duplicate question ${label}`)
      labels.add(label)
      const blocks: MinimarkNode[] = []
      while (nodes.length && !anchor(nodes[0]) && !element(nodes[0], 'h2') && !element(nodes[0], 'h3')) {
        blocks.push(nodes.shift()!)
      }
      group.questions.push(question(label, blocks))
    }
    if (!group.questions.length) fail(`${id}: missing questions`)
    groups.push(group)
  }
  if (!groups.length) fail('missing question groups')
  const heading = nodes.shift()
  if (!element(heading, 'h2')) fail('missing closing contact section')
  const description = plain(paragraph(nodes.shift()))
  const list = nodes.shift()
  if (!element(list, 'ul') || children(list).length !== 2 || nodes.length) fail('closing section needs exactly two links')
  const buttons = children(list).map((item) => {
    if (!element(item, 'li')) return fail('invalid closing link')
    let contents = children(item)
    if (contents.length === 1 && element(contents[0], 'p')) contents = children(contents[0])
    if (contents.length !== 1 || !element(contents[0], 'a')) return fail('expected a closing link')
    const part = parts(['p', {}, contents[0]])[0]!
    return { label: part.text, to: part.to! }
  })
  return { hero: { title }, groups, cta: { title: plain(heading), description, primary: buttons[0]!, secondary: buttons[1]! } }
}
