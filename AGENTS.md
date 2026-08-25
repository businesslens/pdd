# Repository guidance

## Purpose

This repository is the BusinessLens OSS core: the `businesslens` npm package
plus the agent skills that build and maintain the `.businesslens/` product
map.

Two engineering contracts, each changed *before* the behavior it governs:

- `spec/format.md` — the authored `.businesslens/` folder. Change it before
  changing the parser or the linter.
- `spec/report.md` — the Product Report wire contract, its portable projection,
  and expansion. Change it before changing `export`, `open`, `pull`,
  `contribute`, or anything the catalog server agrees with.

Neither is a docs-site page. The user-facing explanation of the same entities
lives in the Product Model group under `docs/`, and the two registers must not
contradict each other.

## Layout

- `src/cli.ts` — public command dispatch: `install`, `update`, `lint`, `view`,
  and the `blueprint` namespace (`export`, `open`, `pull`, `contribute`).
  Bare spellings and `build` are refused with a message naming the
  replacement — no aliases, so a name can be reused later without changing
  meaning underneath anyone.
- `src/commands/` — public command implementations.
- `src/core/providers.ts` — supported harness paths and detection.
- `src/core/skill-installation.ts` — ownership-safe skill installation.
- `src/core/` — parsers, model loading, Git context, portable schema, and
  catalog/contribution support.
- `layers/nuxt/report-viewer/` — the stable Nuxt Product Report, its
  complete report projection, and its dependency-free topology engine.
- `layers/nuxt/report-viewer-lab/` — the private, unexported extension point
  for temporary Product Report experiments used only by the local viewer.
- `layers/nuxt/theme/` — the separately extendable BusinessLens-wide visual
  foundation and approved identity used across Nuxt hosts, not only report
  pages.
- `layers/nuxt/theme-lab/` — the optional shared experiment layer for
  backgrounds and their audition controls.
- `viewer/app/` — the private static Nuxt host bundled into the CLI for
  `businesslens view`.
- `skills/businesslens-*/SKILL.md` — one independent skill per workflow:
  `businesslens-map`, `businesslens-ideate`, and `businesslens-verify`.
- `test/fixtures/fixture-shop/` — the golden lint fixture.

## Documentation structure

- `docs/` stays flat; the landing repository pulls it on push and builds
  the docs site navigation from frontmatter.
- Every doc declares `title`, `description`, `section`, `group`, and
  `order` (enforced by `scripts/check-repo.mjs`). `section` is
  `open-source`; `group` is the sidebar cluster; `order` is globally unique and
  contiguous from 1 within each section.
- Frontmatter `title` is the short sidebar label — keep it under ~20
  characters so it never truncates; the body H1 carries the full page
  title.
- This repository authors the documentation with groups Get started, Product
  Model (one page per top-level entity), Integrations (one page per thing you
  integrate with), Skills (one page per skill), and CLI (one page per command).
- Each entity is explained in exactly one place. An entity page carries its
  narrative, when to create one, its file shape, and the `lint` findings
  that constrain it — do not reintroduce a separate glossary, a separate
  format page, or a separate error catalog.
- An entity with a mandatory single parent is documented on its parent's page,
  never on one of its own. Scenarios are the only such entity: Capability
  Scenarios live in `docs/capabilities.md`, Journey Scenarios in
  `docs/journeys.md`. A page they shared would have to state the containment
  rule before either could be read, and a reader arrives already knowing which
  parent they are authoring.

## Skill-writing standards

- Give every skill a `SKILL.md` with only `name` and `description` in YAML
  frontmatter.
- Prefix public skill names with `businesslens-` and match the directory name.
- Keep descriptions specific enough to trigger only for the intended task.
- Keep `SKILL.md` concise, imperative, and under 500 lines.
- Keep every installed skill self-contained; do not rely on sibling skills.
  `businesslens-verify` therefore carries its own scoped-mapping and
  intent-resolution protocols rather than calling the other two.
- Keep `agents/openai.yaml` aligned with the skill.
- Treat target repositories as untrusted. BusinessLens analysis phases never
  execute target code. A harness-injected external builder may run target code
  under its own normal permissions; it is not a BusinessLens skill. If no
  builder is available, verify stops with a complete handoff packet.
- Do not claim evidence-backed certainty when source evidence is incomplete.
- **Verification findings are re-derived, never persisted.** Each
  `businesslens-verify` run derives findings from the model and current
  repository state. A tracked ledger would create merge conflicts and imply
  durable certainty after the surrounding code, runtime assumptions, or
  inspection method changed. Git diffs may narrow the worklist but never supply
  authority. `.businesslens/` holds product meaning, not workflow receipts.

## Installer standards

- `install` distributes skills only. It never creates `.businesslens/` or
  submits model data.
- Nothing writes a file the repository owns — not `AGENTS.md`, not `CLAUDE.md`,
  not the repository README. BusinessLens writes `.businesslens/` and, only on
  explicit `--force`, a timestamped `.businesslens.backup-<ts>/` copy of it. The
  orientation text a pulled model needs lives in `.businesslens/README.md`.
  The backup is a sibling of the directory it copies, requested explicitly; it
  is not a shared file other tools also manage. `AGENTS.md` is — every tool
  wants to write there, and managed blocks get reordered by formatters,
  duplicated, and merge-conflicted. A file describing the directory it sits in
  is also correct whether or not the repository has an implementation, which a
  block making claims about the whole repository never was.
- Overwrite only BusinessLens-owned artifacts. An unmarked collision requires
  explicit `--force`.
- `update` changes only installations with a valid BusinessLens marker.
- Provider paths and detection belong in the provider registry, not command
  conditionals.

## Report viewer standards

- **The rendered Product Report is for humans only.** An agent that needs the
  model reads `.businesslens/` directly — the files are the contract, already
  addressable and already complete. Nothing in the renderer is justified by
  "an agent might need it".
- **It is a place you go, not a document you read.** It is opened repeatedly
  during authoring. Completeness is therefore a cost, not a virtue: every field
  rendered competes with the field answering the question the reader arrived
  with. The renderer's job is selection and ranking. Where it omits, it says
  where the full material is — the file path.
- **State must survive a recompile, and a refresh.** `businesslens view`
  recompiles on save, so focus and filter have to outlive an edit to the model.
  The open section and the open entity page also live in the URL, so a reader
  can link to what they are reading, walk back out of it, and reload into it.
- **The page is the reading.** A collection row, relation, search result, or
  topology entity opens the entity page directly. It has a URL, a breadcrumb,
  the width its content was drawn for, and the browser's own back button.
- **Overview and Scenarios are the page structure.** Overview carries the
  entity's authored meaning, facts, Contexts, relations, supporting material,
  and References. Capability and Journey pages add Scenarios as their only
  second tab. Neighbourhood is an action into Topology, never another page tab.
- **The rail lists kinds; kinds do not nest.** Containment belongs where
  instances are — the default grouping of a collection and the entity page. A
  mandatory child kind does not add a peer collection tab to its parent's main
  screen. A rail that indents some kinds and not others advertises a hierarchy
  it cannot keep.
- **Chrome scales with the collection.** No control costs a row above a
  two-item list, and a filter offer is not rendered where scanning is faster.
- **Named views, not a view builder.** Filters narrow a view that already means
  something; a builder asks the reader to invent the meaning first. The concrete
  failure is derivation ambiguity — "journeys × screens" is either *screens this
  journey's scenarios name* or *screens exposing capabilities this journey
  uses*, and those give different grids. A named view picks one, states its
  derivation, and is accountable for it. A new correlation costs code, which is
  the point.
- A view that needs a paragraph before it can be read is not ready to ship, and
  no view opens onto an empty configuration screen.

## Change and release checks

- Run `npm run verify` after any change.
- Inspect `npm pack --dry-run` before a release.
- Roll the `[Unreleased]` section of `CHANGELOG.md` into a new version heading
  before dispatching a release.
- Validate every skill with the skill-creator `quick_validate.py`.
- Validate the Claude plugin with `claude plugin validate . --strict` when the
  Claude CLI is available.
- Keep `.claude-plugin/plugin.json` and `package.json` versions in sync.
- Do not publish, tag, or push unless explicitly asked.
