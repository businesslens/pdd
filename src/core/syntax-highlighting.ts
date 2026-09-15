import { basename, extname } from 'node:path'
import { bundledLanguages, bundledLanguagesAlias, codeToTokens, type BundledLanguage } from 'shiki'
import type { ElementNode, Node } from 'comark'

const aliases: Record<string, string> = {
  mjs: 'javascript', cjs: 'javascript', mts: 'typescript', cts: 'typescript',
  h: 'c', hpp: 'cpp', tf: 'hcl', tfvars: 'hcl', env: 'dotenv',
  dockerfile: 'dockerfile', makefile: 'makefile', gemfile: 'ruby'
}

export function codeLanguage(value: string): BundledLanguage | 'text' {
  const key = value.toLowerCase()
  const language = aliases[key] ?? key
  if (Object.hasOwn(bundledLanguages, language)) return language as BundledLanguage
  if (Object.hasOwn(bundledLanguagesAlias, language)) return language as BundledLanguage
  return 'text'
}

export const fileLanguage = (path: string) => codeLanguage(extname(path).slice(1) || basename(path))

/** One server-side highlighter serves Markdown fences and complete source files. */
export async function highlightedCode(source: string, language: string, options: {
  filename?: string
  sourceFile?: boolean
  first?: number
  last?: number
} = {}): Promise<ElementNode> {
  const lines = source.split(/\r\n|\n|\r/)
  if (options.sourceFile && lines.length > 1 && lines.at(-1) === '') lines.pop()
  // Large files remain readable without spending unbounded time in grammar regexes.
  const supported = source.length <= 250_000 && lines.every(line => line.length <= 10_000)
    ? codeLanguage(language) : 'text'
  let tokens: Awaited<ReturnType<typeof codeToTokens>>['tokens'] | undefined
  if (supported !== 'text') {
    try {
      tokens = (await codeToTokens(lines.join('\n'), {
        lang: supported, themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false
      })).tokens
    } catch { /* Unknown grammars never prevent reading the original source. */ }
  }
  const children: Node[] = lines.map((line, index): ElementNode => {
    const number = index + 1
    const highlighted = options.first !== undefined && number >= options.first && number <= options.last!
    const content: Node[] = tokens?.[index]?.map(token => ['span', { style: token.htmlStyle ?? {} }, token.content] as ElementNode) ?? [line]
    if (options.sourceFile) {
      if (number === (options.first ?? 1)) content.unshift(['span', { id: 'reference' }])
      content.unshift(['a', { class: 'blr-line-number', href: '#L' + number, 'aria-label': 'Line ' + number }, String(number)])
    }
    return ['span', {
      class: 'line' + (highlighted ? ' highlight' : ''),
      ...(options.sourceFile ? { id: 'L' + number } : {})
    }, ...content, ...(index < lines.length - 1 ? ['\n'] : [])]
  })
  return ['pre', {
    class: 'shiki' + (options.sourceFile ? ' blr-source-code' : ''),
    language, code: source,
    ...(options.filename ? { filename: options.filename } : {})
  }, ['code', {}, ...children]]
}
