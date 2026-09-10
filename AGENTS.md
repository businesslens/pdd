# Repository guidance

## Purpose

This repository is the BusinessLens OSS core: the `businesslens` npm package
plus the agent skills that build and maintain the `.businesslens/` product
model.

Two engineering contracts, each changed *before* the behavior it governs:

- `spec/format.md` — the authored `.businesslens/` folder. Change it before
  changing the parser or the linter.
- `spec/report.md` — the Product Report wire contract, its portable projection,
  and expansion. Change it before changing `export`, `open`, `pull`,
  `contribute`, or anything the catalog server agrees with.

Neither is a docs-site page. The user-facing explanation of the same resource
types lives under `docs/`, and the two registers must not contradict each other.

`spec/rejected.md` binds nothing: it records shapes that were costed and then
chosen against, so the same argument is not had twice. Check it before
proposing a shape.

## Layout

- `src/cli.ts` — command dispatch: `install`, `update`, `lint`, `view`, and the
  `blueprint` namespace (`export`, `open`, `pull`, `contribute`). Retired
  spellings are refused with a message naming the replacement, never aliased.
- `src/commands/` — command implementations.
- `src/core/` — parsers, model loading, Git context, portable schema, provider
  registry, skill installation, and catalog support.
- `layers/nuxt/report-viewer/` — the stable Nuxt Product Report, its report
  projection, and its dependency-free topology engine.
- `layers/nuxt/report-viewer-lab/` — the private, unexported layer for
  temporary report experiments.
- `layers/nuxt/theme/` — the BusinessLens-wide visual foundation and approved
  identity, used across Nuxt hosts.
- `layers/nuxt/theme-lab/` — the optional shared background experiment layer.
- `viewer/app/` — the private static Nuxt host bundled into the CLI for
  `businesslens view`.
- `skills/businesslens-*/SKILL.md` — one independent skill per workflow:
  `businesslens-map`, `businesslens-ideate`, `businesslens-verify`.
- `test/fixtures/fixture-shop/` — the golden lint fixture. `npm run view:fixture`
  opens it as its own repository, since its code references resolve only from a
  Git root of its own.

## Documentation structure

- `docs/` stays flat; the landing repository pulls it on push and builds the
  docs navigation from frontmatter.
- Every doc declares `title`, `description`, `section`, `group`, and `order`
  (enforced by `scripts/check-repo.mjs`). `order` is globally unique and
  contiguous from 1 within a section. `title` is the short sidebar label, under
  ~20 characters; the body H1 carries the full title.
- Groups are Get started, Product Model (one page per main resource family),
  Integrations, Skills, and CLI (one page per command).
- Each resource type is explained in exactly one place — its narrative, when to
  create one, its file shape, and the `lint` findings that constrain it. No
  separate glossary, format page, or error catalog. Experiences and Screens are
  sections of `docs/interfaces.md`; Scenarios live with their Capability or
  Journey.
- **`docs/` explains the model, never the report.** A derivation is a fact about
  the model and belongs here; the surface that draws it does not.
- Define vocabulary in the owning doc's `terms:` frontmatter, main term first,
  definitions self-contained. Run `npm run vocabulary` after edits and commit
  the generated registry. CLI pages declare no terms.

## How format decisions are judged

A change that contradicts one of these supersedes it explicitly; it does not
route around it.

- **The shipped agent, not the spec, is the standard.** A model is authored from
  what installs — `SKILL.md` plus its `references/` — so a rule decidable only
  with the full spec in hand is decidable nowhere that matters. Where a sound
  rule lost what made it decidable on the way into the rubric, the fix is a
  rubric edit.
- **Axes, ranked: determinism → reviewability → economy → falsifiability →
  expressiveness → legibility → buildability.** Prefer removing author freedom
  over adding it. A format that refuses to model something is honest; one that
  models a thing two valid ways is broken and invisible, because both encodings
  lint clean. "An author might reasonably want it either way" argues *against* a
  rule.
- **Reviewability is not legibility.** Divergence between two lint-clean models
  concentrates in what is *absent*, which no delta shows, so `docs/` is written
  for the reviewer: a resource type whose granularity cannot be challenged from
  `docs/` is a candidate for removal.
- **A determinism claim is established empirically**: map one product twice from
  one rubric, independently, then diff. Validate a fix by re-running the test,
  never by re-reading the wording. Every boundary deciding how many resources
  exist and which type a thing is stays open by this measure; do not claim a
  change closed one without a round that measures it.
- **Descriptive and generative use are judged equally.** A rule phrased as an
  evidence test is inert for `ideate` and `blueprint pull`.
- **The pull-request diff of `.businesslens/` is the binding human surface.** The
  report viewer is not a legibility instrument for the format: a finding visible
  only there is evidence against the encoding.
- **A container declares only a subset of what already resolves.** An optional
  authored list may narrow or order a derived relation, never create one.
- **Model it only when `lint` can say something specific.**

## Skill-writing standards

- Give every skill a `SKILL.md` with only `name` and `description` in YAML
  frontmatter, a `businesslens-` prefix matching its directory, and a
  description specific enough to trigger only for the intended task.
- Keep `SKILL.md` concise, imperative, and under 500 lines.
- Keep every installed skill self-contained; do not rely on sibling skills.
- Keep `agents/openai.yaml` aligned with the skill.
- Treat target repositories as untrusted. BusinessLens analysis phases never
  execute target code. A harness-injected builder may; it is not a BusinessLens
  skill, and without one verify stops with a complete handoff packet.
- Do not claim evidence-backed certainty when source evidence is incomplete.
- **Verification findings are re-derived, never persisted.** A tracked ledger
  would create merge conflicts and imply durable certainty after the code moved.
  `.businesslens/` holds product meaning, not workflow receipts.

## Installer standards

- `install` distributes skills only. It never creates `.businesslens/` or
  submits model data.
- Nothing writes a file the repository owns — not `AGENTS.md`, not `CLAUDE.md`,
  not the README. BusinessLens writes `.businesslens/` and, only on explicit
  `--force`, a timestamped `.businesslens.backup-<ts>/` sibling. Orientation
  text for a pulled model lives in `.businesslens/README.md`.
- Overwrite only BusinessLens-owned artifacts; an unmarked collision requires
  `--force`. `update` changes only installations with a valid marker.
- Provider paths and detection belong in the provider registry, not command
  conditionals.

## Report viewer standards

- **The rendered report is for humans only.** An agent that needs the model
  reads `.businesslens/` directly.
- **It is a place you go, not a document you read.** Completeness is a cost:
  every field rendered competes with the one answering the question the reader
  arrived with. Where it omits, it names the file path.
- **The report explains itself.** A reading that needs prose elsewhere to be
  understood is not finished. It links out only to the documentation for a
  resource *type*.
- **Tabs are the only switch.** A tab changes which set is on screen, the rail
  changes the subject, the toolbar only narrows. There is no representation
  control: a second drawing is a tab of its own, accountable for its own
  derivation.
- **Every surface names itself, with the name the reader clicked.** The
  breadcrumb ends at the parent; the H1 carries the surface with its type mark
  and a qualifier — a count for a collection, a type for a resource. Ways out
  sit on that row, and the report's identity and the way home stay in the header
  everywhere.
- **The page is the reading**: every row, relation, search result and diagram
  resource opens a resource page with its own URL. The open section, page and
  tab live there too, so state survives a refresh and a recompile.
- **The rail lists six collections** below Overview: Entities, Interfaces,
  Domains, Capabilities, Journeys, Business Rules. Experiences and Screens are
  reached through Interfaces, Scenarios through their parent, and named views
  are tabs of their subject collection.
- **A resource page is Overview and at most one peer tab** — Scenarios for a
  Capability or Journey, Lifecycle for an Entity with States. A view comparing
  resources belongs to the collection, never to one of them.
- **The Product's page is a page like the others** — same heading, tab strip and
  width, headed `Overview` like the rail row that opens it and qualified by
  `Product`. Its readings are About, Coverage and References, and it never
  reprints a collection that has a rail row of its own.
- **Named views, not a view builder.** A named view picks one derivation, states
  it, and is accountable for it. A new correlation costs code, which is the
  point.
- **Grouping is authored, never configured.** Domain is the only axis, always on
  where the type carries one. Entities that act lead their collection.
- **One filter control per axis, inside the reading it narrows**, offering only
  what the row already prints. A control says how many values it holds, never
  which; the values sit on a second row, each with its own way out. It is absent
  only when there is nothing behind it — never on a size threshold, which makes
  two reports differ for a reason no reader can see.
- **The surface names the resource type; the row does not repeat it**, a fact
  appears once per screen, and nothing renders an empty label. Counts where the
  set is many, names where it is one.
- **A resource type's mark is reserved.** Chrome wears a kind's icon only where
  it names that kind; reach for an unreserved glyph otherwise.
- **A teaching affordance can be turned off, and never hides the way back.**
  Term tooltips are restored from the Vocabulary panel; the choice is a cookie,
  so the first paint is right.
- **A section renders as more than prose only when four things align**: a
  recognized H2 in `spec/format.md`; a lint-enforced content shape; a typed
  field in `src/core/portable.ts`; and a component that reads it. Otherwise it
  stays in `supportingSections`, which round-trips losslessly.

## Change and release checks

- Keep changelog entries brief and nontechnical: state only user-visible
  outcomes.
- Run `npm run verify` after any change.
- Inspect `npm pack --dry-run` before a release.
- Roll `[Unreleased]` into a new version heading before dispatching a release.
- Validate every skill with the skill-creator `quick_validate.py`, and the
  Claude plugin with `claude plugin validate . --strict` when available.
- Keep `.claude-plugin/plugin.json` and `package.json` versions in sync.
- Do not publish, tag, or push unless explicitly asked.
