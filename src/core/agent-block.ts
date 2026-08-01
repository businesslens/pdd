import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BEGIN = '<!-- businesslens:begin -->'
const END = '<!-- businesslens:end -->'

/**
 * The managed block written into `AGENTS.md` when a Blueprint is pulled or a
 * Product Report is opened. It is the only block BusinessLens writes anywhere.
 *
 * A brownfield variant used to exist, written by `businesslens-init` and the
 * since-merged `businesslens-plan`. It was advisory nudging — read the model
 * first, update it after — for a situation that already has a named recovery
 * path in `businesslens-sync`, and it cost two variants across three files that
 * drifted (`plan` handed new products the brownfield text, telling agents to
 * read `codeRefs` in a repository that had none). See adr/0001.
 *
 * This variant is load-bearing instead: without it, "pull it and hand it to
 * your agent" depends on every user inventing the prompt themselves — and since
 * `businesslens-implement` was removed, no skill carries the content either.
 *
 * The dividing line: you need the instruction when the model arrived from
 * somewhere else. If you authored it, you already know what it is.
 */
export const GREENFIELD_AGENT_BLOCK = `${BEGIN}
## BusinessLens Product Model

This repository holds a Product Model in \`.businesslens/\` and **no implementation**.
The model is the specification for a product that has not been built yet.

- **Build the product the model describes.** Read \`.businesslens/product.md\` first, then the
  actors, experiences, features, and business rules.
- **The scenarios are the acceptance contract.** Every file under
  \`.businesslens/journeys/*/scenarios/\` states a Trigger, ordered Steps, and an Outcome that the
  finished product must exhibit. Treat them as the definition of done, not as suggestions.
- **Business rules are invariants.** They hold across every journey, including the ones you write
  last.
- **Nothing here prescribes a stack.** No framework, database, architecture, or interface is
  implied. Choose them yourself and stay consistent.
- **When the product runs, attach evidence** with the \`businesslens-sync\` skill, then run
  \`npx businesslens validate\`. Coverage is \`draft\` until you do.
- To change *what* the product should do rather than implement it, use the \`businesslens-ideate\`
  skill so the model stays the source of truth.
- Never edit \`.businesslens/cache/\` — generated.
${END}`

/**
 * Insert or replace the managed block in `<root>/AGENTS.md`, preserving
 * everything outside the markers.
 */
export function writeGreenfieldAgentBlock(root: string): string {
  const file = join(root, 'AGENTS.md')

  if (!existsSync(file)) {
    writeFileSync(file, `${GREENFIELD_AGENT_BLOCK}\n`, { encoding: 'utf8' })
    return file
  }

  const existing = readFileSync(file, 'utf8')
  const start = existing.indexOf(BEGIN)
  const end = existing.indexOf(END)

  if (start === -1 || end === -1 || end < start) {
    const separator = existing.endsWith('\n') ? '\n' : '\n\n'
    writeFileSync(file, `${existing}${separator}${GREENFIELD_AGENT_BLOCK}\n`, { encoding: 'utf8' })
    return file
  }

  const replaced = existing.slice(0, start) + GREENFIELD_AGENT_BLOCK + existing.slice(end + END.length)
  writeFileSync(file, replaced, { encoding: 'utf8' })
  return file
}
