import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The README written into every `.businesslens/` model created by canonical
 * Product Report expansion — the one thing that tells an agent what the
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

- Read \`product.md\` or \`product/product.md\` first, then the Entities — the
  things the product keeps, including the people and systems that act on it —
  and the Interfaces, optional Experiences, Screens, and Domains, followed by
  Capabilities, Business Rules, Journeys, and both Scenario collections.
- Expect leaf resources as \`<id>.md\`; \`<id>/<type>.md\` means that resource owns
  child resources or assets.
- Treat Capability Scenarios as local acceptance contracts, Journey Scenarios
  as end-to-end Steps contracts, and Business Rules as what must remain true,
  including who may act.
- Do not infer a stack or architecture from the model.
- References are optional navigation and context. Their role explains why an
  artifact is attached; it never proves alignment or replaces product prose.
- After code changes, use \`businesslens-verify\`; run \`npx businesslens lint\`
  for structural checks.
- Use \`businesslens-ideate\` to change intended behavior and \`businesslens-map\`
  only to map established absent or deliberately untrusted behavior.
- Never edit \`cache/\`.

Documentation: https://businesslens.io
`

/**
 * Write the model README, overwriting unconditionally. BusinessLens owns every
 * file in this directory, and an unconditional write is what keeps open,
 * pull, and contribution expansion byte-identical.
 */
export function writeModelReadme(root: string): string {
  const file = join(root, '.businesslens', 'README.md')
  writeFileSync(file, MODEL_README, { encoding: 'utf8' })
  return file
}
