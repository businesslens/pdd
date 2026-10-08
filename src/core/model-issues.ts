import { existsSync, readFileSync } from 'node:fs'
import { join, sep } from 'node:path'

/**
 * One problem with the authored model, shaped for a reader rather than a
 * terminal.
 *
 * Lint keeps reporting plain `file: message` lines; the local viewer needs to
 * group them by file, link them to the resource they belong to, and say which
 * ones made the report leave something out. The split is mechanical because
 * every lint message already leads with the file it is about.
 */
export interface ModelIssue {
  severity: 'error' | 'warning'
  /** The message without its file prefix, starting with a capital letter. */
  message: string
  /** Relative to `.businesslens/`; a folder ends with `/`. Absent when the issue has no file. */
  file?: string
  /** 1-based line in `file`, when the parser reported one. */
  line?: number
  column?: number
  /** Report resource key (`kind:id`) of the resource `file` defines. */
  resource?: string
  /**
   * The loader discarded authored content because of this issue, so the
   * resource it belongs to renders without it.
   */
  incomplete?: boolean
  /** The lines around `line`, for a source frame. */
  excerpt?: Array<{ line: number, text: string }>
}

const FILE_PREFIX = /^((?:[\w.-]+\/)*[\w.-]+\.(?:md|ya?ml|svg|webp|json|txt)|(?:[\w.-]+\/)+)(: | )([\s\S]*)$/
const YAML_POSITION = /\s*at line (\d+), column (\d+):[\s\S]*$/
const DISCARDED = [
  /frontmatter YAML failed to parse/,
  /frontmatter is not terminated with ---/,
  /frontmatter must be a YAML mapping/,
  /"[^"]+" must be (?:a|an) (?:string|list|mapping)\b/,
  /^[\w.-]+(?:\/[\w.-]+)*\/ is missing [\w-]+\.md$/
]

const COLLECTION_KINDS: Record<string, [kind: string, file: string]> = {
  entities: ['entity', 'entity.md'],
  domains: ['domain', 'domain.md'],
  capabilities: ['capability', 'capability.md'],
  journeys: ['journey', 'journey.md'],
  'business-rules': ['rule', 'business-rule.md'],
  variations: ['variation', 'variation.md'],
  interfaces: ['interface', 'interface.md']
}

const stem = (name: string) => name.replace(/\.md$/, '')

/**
 * The report resource a model file defines, by the same paths the loader reads.
 * A folder or a file that defines nothing has no resource.
 */
export function resourceKeyForModelPath(path: string): string | undefined {
  if (!path.endsWith('.md')) return undefined
  const parts = path.split('/')
  const [collection, first, second, third, fourth, fifth] = parts
  const entry = collection ? COLLECTION_KINDS[collection] : undefined
  if (!entry || !first) return undefined
  const [kind, file] = entry
  if (parts.length === 2) return `${kind}:${stem(first)}`
  if (parts.length === 3 && second === file) return `${kind}:${first}`
  if ((kind === 'capability' || kind === 'journey') && second === 'scenarios' && parts.length === 4) {
    return `${kind}-scenario:${stem(third!)}`
  }
  if (kind !== 'interface') return undefined
  if (second === 'screens' && parts.length === 4) return `screen:${first}::${stem(third!)}`
  if (second !== 'experiences' || !third) return undefined
  if (parts.length === 4) return `experience:${first}::${stem(third)}`
  if (parts.length === 5 && fourth === 'experience.md') return `experience:${first}::${third}`
  if (parts.length === 6 && fourth === 'screens') return `screen:${first}::${third}::${stem(fifth!)}`
  return undefined
}

/** Sentence case, unless the message opens with a file name or a field name such as `appliesTo`. */
function capitalize(text: string): string {
  return /^[a-z]+(?=[\s:,(])/.test(text) ? text[0]!.toUpperCase() + text.slice(1) : text
}

/** Labels lint uses for files whose real path depends on the model's shape. */
function resolveLabel(file: string, folder: string): string {
  if (file === 'logo.svg' || file === 'cover.webp') return `product/${file}`
  if (file === 'product.md' && !existsSync(join(folder, 'product.md')) && existsSync(join(folder, 'product', 'product.md'))) {
    return 'product/product.md'
  }
  return file
}

function excerptAround(folder: string, file: string, line: number): ModelIssue['excerpt'] {
  try {
    const lines = readFileSync(join(folder, file), 'utf8').split(/\r?\n/)
    const start = Math.max(1, line - 1)
    const end = Math.min(lines.length, line + 1)
    const excerpt = []
    for (let number = start; number <= end; number += 1) excerpt.push({ line: number, text: lines[number - 1] ?? '' })
    return excerpt
  } catch {
    return undefined
  }
}

/**
 * Turn one lint or loader line into an issue.
 *
 * @param modelRoot the directory that contains `.businesslens/`.
 */
export function modelIssue(text: string, severity: ModelIssue['severity'], modelRoot: string): ModelIssue {
  const folder = join(modelRoot, '.businesslens')
  const prefix = folder + sep
  let raw = text.split(prefix).join('')
  const issue: ModelIssue = { severity, message: raw }

  const position = raw.match(YAML_POSITION)
  if (position) raw = raw.replace(YAML_POSITION, raw.includes('(') ? ')' : '')

  const located = raw.match(FILE_PREFIX)
  if (located) {
    const [, file, separator, rest] = located
    issue.file = resolveLabel(file!, folder)
    // "README.md is missing" reads as a sentence; only a colon separates a label.
    issue.message = capitalize(separator === ': ' ? rest! : raw)
  } else {
    issue.message = capitalize(raw)
  }
  if (issue.file) {
    issue.resource = resourceKeyForModelPath(issue.file)
    if (DISCARDED.some(pattern => pattern.test(issue.message) || pattern.test(raw))) issue.incomplete = true
  }
  if (position && issue.file && !issue.file.endsWith('/')) {
    // A frontmatter parser counts from the line after the opening `---`.
    const offset = /frontmatter/.test(raw) ? 1 : 0
    issue.line = Number(position[1]) + offset
    issue.column = Number(position[2])
    issue.excerpt = excerptAround(folder, issue.file, issue.line)
  }
  return issue
}

/** Every lint error and warning, as issues. */
export function modelIssues(errors: string[], warnings: string[], modelRoot: string): ModelIssue[] {
  return [
    ...errors.map(error => modelIssue(error, 'error', modelRoot)),
    ...warnings.map(warning => modelIssue(warning, 'warning', modelRoot))
  ]
}

/**
 * The issue for a failure that is not a lint finding: an unreadable file, a
 * compiler refusal lint did not predict, or a watcher that stopped.
 */
export function failureIssue(message: string, modelRoot?: string): ModelIssue {
  const unreadable = message.match(/^(E[A-Z]+): [^,]+, \w+ '(.+)'$/)
  if (unreadable && modelRoot) {
    const folder = join(modelRoot, '.businesslens') + sep
    const file = unreadable[2]!.startsWith(folder) ? unreadable[2]!.slice(folder.length) : undefined
    const reason = unreadable[1] === 'EACCES' || unreadable[1] === 'EPERM' ? 'permission denied' : unreadable[1]!
    return { severity: 'error', message: `This file can't be read (${reason}).`, ...(file ? { file, resource: resourceKeyForModelPath(file) } : {}) }
  }
  return modelRoot ? modelIssue(message, 'error', modelRoot) : { severity: 'error', message: capitalize(message) }
}

/** The request a reader pastes into their agent to get the model fixed. */
export function issuesAsRequest(issues: ModelIssue[]): string {
  const errors = issues.filter(issue => issue.severity === 'error')
  const listed = errors.length ? errors : issues
  const lines = listed.map(issue => {
    const named = issue.file && !issue.message.startsWith(issue.file)
    const where = named ? `${issue.file}${issue.line ? ` (line ${issue.line})` : ''}: ` : ''
    return `- ${where}${issue.message}`
  })
  const what = errors.length
    ? `${errors.length} ${errors.length === 1 ? 'error' : 'errors'} that \`businesslens lint\` reports`
    : `${listed.length} ${listed.length === 1 ? 'warning' : 'warnings'} from \`businesslens lint\``
  return `The BusinessLens Product Model in .businesslens/ has ${what}. Fix them so the model lints clean:\n\n${lines.join('\n')}\n`
}
