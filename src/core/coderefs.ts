export interface CodeRef {
  path: string
  symbol?: string
  startLine?: number
  endLine?: number
}

/**
 * Compact grammar: `path[#symbol][:start[-end]]`.
 * The line suffix is the last ":" whose remainder is digits or digits-digits;
 * the symbol is everything after the first "#" of what remains.
 */
export function parseCodeRef(value: string, issues: string[], label: string): CodeRef | undefined {
  let rest = value.trim()
  if (!rest) {
    issues.push(`${label}: empty codeRef`)
    return undefined
  }
  let startLine: number | undefined
  let endLine: number | undefined
  const colon = rest.lastIndexOf(':')
  if (colon !== -1) {
    const suffix = rest.slice(colon + 1)
    const match = suffix.match(/^(\d+)(?:-(\d+))?$/)
    if (match) {
      startLine = Number(match[1])
      endLine = match[2] ? Number(match[2]) : undefined
      rest = rest.slice(0, colon)
    }
  }
  let symbol: string | undefined
  const hash = rest.indexOf('#')
  if (hash !== -1) {
    symbol = rest.slice(hash + 1)
    rest = rest.slice(0, hash)
  }
  if (!rest) {
    issues.push(`${label}: codeRef "${value}" has no path`)
    return undefined
  }
  if (rest.startsWith('/')) {
    issues.push(`${label}: codeRef "${value}" must be repository-relative`)
    return undefined
  }
  if (symbol !== undefined && !symbol) {
    issues.push(`${label}: codeRef "${value}" has an empty symbol`)
    return undefined
  }
  if (startLine !== undefined && endLine !== undefined && endLine < startLine) {
    issues.push(`${label}: codeRef "${value}" has an inverted line range`)
    return undefined
  }
  return { path: rest, symbol, startLine, endLine }
}

export function formatCodeRef(ref: CodeRef): string {
  let result = ref.path
  if (ref.symbol) result += `#${ref.symbol}`
  if (ref.startLine !== undefined) {
    result += `:${ref.startLine}`
    if (ref.endLine !== undefined) result += `-${ref.endLine}`
  }
  return result
}
