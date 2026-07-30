import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BEGIN = '<!-- businesslens:begin -->'
const END = '<!-- businesslens:end -->'

/**
 * The managed block written into `AGENTS.md` when a Blueprint is pulled.
 *
 * Deliberately different from the block `businesslens-plan` writes. That one is
 * for a repository that already has code — "read the relevant journey files to
 * understand current behavior and where it lives". A freshly pulled Blueprint is
 * the opposite situation: there is no implementation, and the model is the
 * specification rather than a map.
 *
 * Without this, "pull it and hand it to your agent" depends on every user
 * inventing the prompt themselves.
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
- **When the product runs, attach evidence** with the \`businesslens-verify\` skill, then run
  \`npx businesslens validate\`. Coverage is \`draft\` until you do.
- To change *what* the product should do rather than implement it, use the \`businesslens-plan\`
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
