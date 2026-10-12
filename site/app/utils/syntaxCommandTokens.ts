export type SyntaxCommandTokenRole = 'executable' | 'arguments'

export interface SyntaxCommandToken {
  role: SyntaxCommandTokenRole
  text: string
}

export interface SyntaxCommandPart {
  role?: SyntaxCommandTokenRole
  text: string
}

export interface SyntaxCommandLine {
  parts: SyntaxCommandPart[]
}

const PDD_KIT_AGENT_COMMAND = /^(?:\/|\$)pdd-[a-z0-9-]+(?:[ \t]+.*)?$/

/** Split a command the same way Shiki's Bash grammar splits our CLI examples. */
export function syntaxCommandTokens(command: string): SyntaxCommandToken[] {
  const separator = command.search(/\s/)
  if (separator === -1) return [{ role: 'executable', text: command }]

  return [
    { role: 'executable', text: command.slice(0, separator) },
    { role: 'arguments', text: command.slice(separator) }
  ]
}

function sourceLines(code: string) {
  const lines: Array<{ content: string, ending: string }> = []
  let start = 0

  for (let index = 0; index < code.length; index++) {
    const character = code[index]
    if (character !== '\n' && character !== '\r') continue

    const end = character === '\r' && code[index + 1] === '\n' ? index + 2 : index + 1
    lines.push({ content: code.slice(start, index), ending: code.slice(index, end) })
    start = end
    index = end - 1
  }

  if (start < code.length || !lines.length) {
    lines.push({ content: code.slice(start), ending: '' })
  }

  return lines
}

/**
 * Plain-text fences are correct for coding-agent invocations: they are not
 * shell commands. Recognize only those fences so diagrams and other `text`
 * examples do not acquire command coloring accidentally.
 */
export function pddKitAgentCommandLines(
  code: string | undefined,
  language: string | undefined
): SyntaxCommandLine[] | null {
  if (language !== 'text' || !code) return null

  const lines = sourceLines(code)
  const commandLines = lines.map(line => line.content.trim())
  const firstCommand = commandLines.findIndex(Boolean)
  let lastCommand = commandLines.length - 1
  while (lastCommand >= 0 && !commandLines[lastCommand]) lastCommand--

  if (firstCommand === -1) return null
  if (commandLines.slice(firstCommand, lastCommand + 1)
    .some(command => !command || !PDD_KIT_AGENT_COMMAND.test(command))) return null

  return lines.map((line, index) => {
    const command = commandLines[index]!
    if (!command) return { parts: [{ text: line.content + line.ending }] }

    const commandStart = line.content.indexOf(command)
    const commandEnd = commandStart + command.length
    const parts: SyntaxCommandPart[] = []

    if (commandStart > 0) parts.push({ text: line.content.slice(0, commandStart) })
    parts.push(...syntaxCommandTokens(command))
    if (commandEnd < line.content.length) parts.push({ text: line.content.slice(commandEnd) })
    if (line.ending) parts.push({ text: line.ending })

    return { parts }
  })
}
