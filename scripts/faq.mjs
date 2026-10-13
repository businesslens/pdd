import { parseMarkdown } from 'comark'

// FAQ is a standalone site page, authored as GitHub-readable Markdown.
// Validate its outline here; the site (`site/`) validates the detailed rendering shapes.
export async function faqProblems(source) {
  const errors = []
  const { nodes } = await parseMarkdown(source, { autoUnwrap: false })
  const tag = node => Array.isArray(node) ? node[0] : undefined
  const text = node => typeof node === 'string' ? node : node.slice(2).map(text).join('')
  const anchor = node => {
    const child = tag(node) === 'p' && node.length === 3 ? node[2] : node
    return tag(child) === 'a' && child.length === 2 ? child[1].name : undefined
  }
  const fail = message => errors.push(`docs/faq.md: ${message}`)
  if (tag(nodes.shift()) !== 'h1') fail('start with one H1 title')
  const ids = new Set()
  let groupCount = 0
  while (anchor(nodes[0])) {
    const id = anchor(nodes.shift())
    if (!/^[a-z][a-z0-9-]*$/.test(id) || ids.has(id)) fail(`invalid or duplicate group anchor ${id}`)
    ids.add(id)
    groupCount++
    if (tag(nodes.shift()) !== 'h2') fail(`${id} needs an H2 heading`)
    if (tag(nodes.shift()) !== 'p') fail(`${id} needs a description paragraph`)
    const questions = new Set()
    while (tag(nodes[0]) === 'h3') {
      const label = text(nodes.shift())
      if (questions.has(label)) fail(`duplicate question ${label}`)
      questions.add(label)
      let blocks = 0
      while (nodes.length && !anchor(nodes[0]) && !['h2', 'h3'].includes(tag(nodes[0]))) {
        const node = nodes.shift()
        if (!['p', 'table', 'pre'].includes(tag(node))) fail(`unsupported answer block in ${label}`)
        blocks++
      }
      if (!blocks) fail(`missing answer for ${label}`)
    }
    if (!questions.size) fail(`${id} needs questions`)
  }
  if (!groupCount) fail('include at least one question group')
  if (tag(nodes.shift()) !== 'h2' || tag(nodes.shift()) !== 'p') fail('end with a contact heading and description')
  const links = nodes.shift()
  if (tag(links) !== 'ul' || links.length !== 4) fail('the contact section needs two links')
  if (nodes.length) fail('unexpected content after the contact section')
  return errors
}
