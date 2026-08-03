import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The README written into `.businesslens/` when a Blueprint is pulled or a
 * Product Report is opened — the one thing that tells an agent what the
 * directory is for when the model arrived from another repository.
 *
 * It used to be a managed block in the repository's root `AGENTS.md`. That
 * location was chosen for reach: speaking to an agent not running a
 * BusinessLens skill. But the block only ever survived for the greenfield case
 * (a model, no implementation), and in that case `.businesslens/` is the only
 * thing in the repository — an agent asked to build has nothing else to read.
 * The reach argument was weakest exactly where the block was load-bearing. See
 * adr/0004-write-nothing-outside-businesslens.md.
 *
 * Living inside the directory also kills the greenfield/brownfield variant
 * problem: a file describing the directory is correct in both states, where a
 * block making claims about the whole repository had to pick one.
 *
 * BusinessLens now writes nothing outside `.businesslens/`, without exception.
 */
export const MODEL_README = `# Product Model

This directory is a **BusinessLens Product Model**: what this product does and
for whom. It is plain Markdown tracked in Git, and it is the source of truth for
intended product behavior.

## If you are an agent working in this repository

- Read \`product.md\` first, then the actors, experiences, optional screens,
  domains, features, business rules, journeys, and scenarios.
- Treat scenarios as the acceptance contract and business rules as invariants.
- Do not infer a stack or architecture from the model.
- Treat \`codeRefs\` as optional navigation, never proof or implementation state.
- After code changes, use \`businesslens-verify\`; run \`npx businesslens lint\`
  for structural checks.
- Use \`businesslens-ideate\` to change intended behavior and \`businesslens-map\`
  only to map established absent or deliberately untrusted behavior.
- Never edit \`cache/\`.

Documentation: https://businesslens.io
`

/**
 * Write the model README, overwriting unconditionally. BusinessLens owns every
 * file in this directory, and an unconditional write is what keeps a re-opened
 * model byte-identical to the first expansion.
 */
export function writeModelReadme(root: string): string {
  const file = join(root, '.businesslens', 'README.md')
  writeFileSync(file, MODEL_README, { encoding: 'utf8' })
  return file
}
