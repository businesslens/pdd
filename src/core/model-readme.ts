import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The README written into every `product-model/` model created by canonical
 * Product Report expansion — the one thing that tells an agent what the
 * directory is for when the model arrived from another repository.
 *
 * It used to be a managed block in the repository's root `AGENTS.md`. That
 * location was chosen for reach: speaking to an agent not running a
 * pdd-kit skill. But the block only ever survived for the greenfield case
 * (a model, no implementation), and in that case `product-model/` is the only
 * thing in the repository — an agent asked to build has nothing else to read.
 * The reach argument was weakest exactly where the block was load-bearing. See
 * adr/0004-write-nothing-outside-pdd-kit.md.
 *
 * Living inside the directory also kills the greenfield/brownfield variant
 * problem: a file describing the directory is correct in both states, where a
 * block making claims about the whole repository had to pick one.
 *
 * pdd-kit now writes nothing outside `product-model/`, without exception.
 */
export const MODEL_README = `# Product Model

This directory is the **Product Model** of this repository, kept with
pdd-kit for Product-Driven Development (PDD): who the product serves, where
they reach it, what it keeps, what it can do, and which rules must stay true. It
is plain Markdown tracked in Git, and it is the source of truth for the intended
product definition.

## If you are an agent working in this repository

- **To implement it**, all of it or a part, work the way you and the user
  normally do. The model is the acceptance contract: see *What the code must
  honor* below. When you finish, recommend checking the code against the model
  with the \`pdd-verify\` skill; do not run the check unless asked.
- If the repository's agent instructions or the request say "Implement with
  pdd-verify: plan the work from \`product-model/\` in phases and check each
  part before the next.", or the installed \`pdd-verify\` skill says this
  install orchestrates implementation, implement with \`pdd-verify\` instead,
  unless the request says to implement without it.
- **To check the code against it**, use \`pdd-verify\`. **To change
  what the product should do**, use \`pdd-ideate\`. To model established
  code the model does not cover, use \`pdd-map\`.
- If those skills are not installed, run \`npx pdd-toolkit install\`.
- Do not edit this directory while implementing. If the model is ambiguous or
  seems wrong, stop and ask; never settle a product question in code.
- Never edit \`cache/\`. Run \`npx pdd-toolkit lint\` for structural checks.

## What the code must honor

- Capability Scenarios are acceptance tests for one Capability; Journey
  Scenarios are end-to-end tests across Capabilities.
- Business Rules must stay true. A Rule's \`permits\` names exactly who may
  perform an operation; everyone else is refused.
- A Screen's \`shows\` and \`collects\` are the facts it presents and the input
  it takes, not its layout or design.
- \`availability\` names the Interfaces and Experiences where behavior must
  work.
- An Entity's facts and states are what the product keeps and distinguishes,
  not a storage schema.
- A Variation's \`selectedWhen\` says what chooses each supported alternative.

## What it does not prescribe

- The stack and architecture: choose them yourself.
- Domains group the model by subject; they are not modules or services.
- References are navigation and context. They never prove the code matches and
  never prescribe a design.
- \`coverage.md\` says which of the repository's code the model accounts for,
  never whether that code matches it; it stays empty until code is mapped.

## Reading order

Start with \`product.md\` or \`product/product.md\`, then Entities, Interfaces
with their Experiences and Screens, Domains, Capabilities and their Scenarios,
Business Rules, Journeys and their Scenarios, and Variations. A resource is
\`<id>.md\`, or \`<id>/<type>.md\` when it owns child resources or assets.

Documentation: https://pdd-kit.dev
`

/**
 * Write the model README, overwriting unconditionally. pdd-kit owns every
 * file in this directory, and an unconditional write is what keeps open,
 * pull, and contribution expansion byte-identical.
 */
export function writeModelReadme(root: string): string {
  const file = join(root, 'product-model', 'README.md')
  writeFileSync(file, MODEL_README, { encoding: 'utf8' })
  return file
}
