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

Neither is a docs-site page. The user-facing explanation of the same resource
types lives in the Product Model group under `docs/`, and the two registers must
not contradict each other.

`spec/rejected.md` sits beside them and binds nothing: it records shapes that
were costed and then chosen against, so the same argument is not had twice.

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
- `test/fixtures/fixture-shop/` — the golden lint fixture. `npm run view:fixture`
  opens it in the local report as its own repository, since its code references
  resolve only from a Git root of its own.

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
  Model (one page per main resource family), Integrations (one page per
  thing you integrate with), Skills (one page per skill), and CLI (one page per
  command).
- Each resource type is explained in exactly one place. Its page carries its
  narrative, when to create one, its file shape, and the `lint` findings
  that constrain it — do not reintroduce a separate glossary, a separate
  format page, or a separate error catalog.
- Define vocabulary in the owning doc's `terms:` frontmatter. Run
  `npm run vocabulary` after edits and commit the generated registry.
- Keep definitions self-contained and capitalize referenced types. Put the page's
  main term first; CLI pages do not declare terms.
- Experiences and Screens are sections of `docs/interfaces.md`, including their
  definitions, file shapes, and lint rules. They have no separate docs pages or
  sidebar entries. Capability Scenarios live in `docs/capabilities.md`, Journey
  Scenarios in `docs/journeys.md`. This supersedes the earlier rule requiring
  Experiences and Screens to have their own pages; their resource types and
  authored containment remain unchanged.

## How format decisions are judged

These constrain `spec/format.md` and `spec/report.md`. A change that contradicts
one supersedes it explicitly; it does not route around it. Check
`spec/rejected.md` before proposing a shape — much of what looks new has been
costed already.

- **The shipped agent, not the spec, is the standard.** A model is authored from
  what installs — `SKILL.md` plus its `references/` — against an unfamiliar
  repository, so a rule decidable only with the full spec in hand is decidable
  nowhere that matters. Where a rule is sound but its distillation into the
  rubric dropped what made it decidable, the defect is the **skill's** and the
  fix is a rubric edit.
- **Axes, ranked: determinism → reviewability → economy → falsifiability →
  expressiveness → legibility → buildability.** Prefer removing author freedom
  over adding it. A format that refuses to model something is honest and
  visible; one that models a thing two valid ways is broken and invisible,
  because both encodings lint clean. "An author might reasonably want it either
  way" argues *against* a rule.
- **Reviewability is second, and it is not legibility.** Divergence between two
  lint-clean models concentrates in what is *absent*, which no delta shows, so
  `docs/` is written for the reviewer: a resource type whose granularity cannot
  be challenged from `docs/` is a candidate for removal.
- **A determinism claim is established empirically**: map one product twice from
  one rubric, independently, then diff. Both readings defensible is a defect in
  the format and needs no adjudication; one plainly wrong against the spec is a
  defect in the rubric. Validate a fix by re-running the test, never by
  re-reading the wording. Every boundary deciding *how many* resources exist and
  *which type* a thing is — Capability granularity, Interface against
  Experience, Rule against Scenario, Domain cuts — is open by this measure, and
  the human approval gate does not catch it; do not claim a change closed one
  without a round that measures it.
- **Descriptive and generative use are judged equally.** A rule phrased as an
  evidence test is inert for `ideate` and `blueprint pull`. Restate it
  structurally, or say the type means something in one direction only.
- **The pull-request diff of `.businesslens/` is the binding human surface.**
  Frontmatter density, key vocabularies, and relation encoding are judged as
  diff artifacts. The report viewer is not a legibility instrument for the
  format: a finding visible only there is evidence against the encoding.
- **A container declares only a subset of what already resolves.** An optional
  authored list may narrow or order a derived relation, never create one.
- **Model it only when `lint` can say something specific.** Where the only
  possible message is "unknown key", it does not belong in the model.

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
  The open section and the open resource page also live in the URL, so a reader
  can link to what they are reading, walk back out of it, and reload into it.
- **The page is the reading.** A collection row, relation, search result, or
  topology resource opens the resource page directly. It has a URL, a
  breadcrumb, the width its content was drawn for, and the browser's own back
  button.
- **Tabs are the only switch.** A tab changes which set is on screen, the rail
  changes the subject, and the toolbar only narrows what is already there. There
  is no representation control, because "the same rows drawn differently" was
  never true of any of them: a relationship graph shows edges a list does not,
  and a containment map adds the Product root. A second drawing is a tab of its
  own, accountable for its own derivation and free to grow the controls that
  drawing needs. One idiom means a reader learns the report once.
- **Every surface names itself, with the name the reader clicked.** The
  breadcrumb is a path, not a title: it ends at the parent, and an H1 carries the
  current surface with its type mark, a qualifier, and its term tooltip. A rail
  row and the heading it opens say the same word, so Overview heads its page
  `Overview` exactly as Entities heads its page `Entities`. The qualifier says
  what you are looking at — a count for a collection, a type for a resource, and
  for the Overview the resource type it presents, which is `Product`. Nothing in
  the report names the rendered artifact: `Product Report` is what the reader is
  looking at rather than anything the model authors, and naming it there put a
  view, an artifact and a type in one line while the tooltip defined a fourth.
  The report's identity and the way home stay in the header on every surface,
  including the one they lead to, and the first crumb carries the house in every
  model — a way home that changes shape with the model is not one affordance. A
  Product's own logo is content rather than chrome: it belongs to the reading
  that carries its name. Ways out —
  documentation, and a named view belonging to another subject — sit on that H1
  row, because an exit belongs to the subject and not to whichever tab happens
  to be open. Every surface then reads the same way down the page: what this is
  and the ways out, which set, what narrows it. The tab strip renders only where
  a second tab exists.
- **The Product's page is a page like the others.** It carries the same heading,
  the same tab strip and the same full width, and it is headed `Overview` like
  the rail row that opens it, qualified by the resource type it presents. It is
  the one row that opens a resource rather than a collection, which is why its
  qualifier is a type where a collection's is a count. Its readings are About,
  Coverage and References. About is the Product itself — its mark and name, who
  it is for, what it says about itself, and how much of it the model holds — and
  it is one tab because splitting an identity across two made the reader open
  both to learn one thing, and left the first with too little to arrive at. Its About, Coverage, Model counts
  and References are peer tabs, not stacked disclosures a reader has to open to
  learn whether they hold anything — a disclosure column is a switch idiom
  nowhere else in the report uses, and it hides the answer behind the question.
  It never reprints a collection that already has a rail row, a page and a count
  of its own: listing Journeys on the way past made the Product page a duplicate
  of the one place that owns them, and a centred column made it the one surface
  that read differently from every other.
- **Overview and one peer tab are the page structure.** Overview carries the
  resource's authored meaning, facts, Contexts, relations, supporting material,
  and References. Capability and Journey pages add Scenarios as their only
  second tab; an Entity with States adds Lifecycle, its composed machine and
  what leaves a thing in each state. A view that compares resources belongs to
  the collection, never to a third tab on one of them: one Journey's page cannot
  answer a question about how Journeys compare, so Composition is a Journeys
  tab. This supersedes the prior convention placing a neighbourhood action on
  the page.
- **The rail lists six main resource collections.** Entities, Interfaces,
  Domains, Capabilities, Journeys, and Business Rules sit below Overview in
  Resources. Experiences and Screens are reached through Interfaces, Scenarios
  through their Capability or Journey. Containment belongs in the Interfaces
  list rows and resource pages, with actual ownership breadcrumbs — a
  collection reads as one row shape whatever it holds, so no collection draws
  itself as a tree. Named visualizations are tabs of their subject collection.
  This supersedes the prior convention exposing Experiences and Screens as
  independent rail entries.
- **Chrome scales with the collection**, but never on a hidden threshold. No
  control costs a row above a two-item list. A control is absent only when there
  is nothing behind it — no axis to narrow by, no second option to choose. Sizing
  the offer to the collection instead made two reports of the same renderer
  differ for a reason no reader could see, which is worse than the row it saved:
  a reader learns the report once, and what they learned has to hold in the next
  one.
- **Named views, not a view builder.** Filters narrow a view that already means
  something; a builder asks the reader to invent the meaning first. The concrete
  failure is derivation ambiguity — "journeys × screens" is either *screens this
  journey's scenarios name* or *screens exposing capabilities this journey
  uses*, and those give different grids. A named view picks one, states its
  derivation, and is accountable for it. A new correlation costs code, which is
  the point.
- **Grouping is authored, never configured.** Offering a reader every related
  kind to group by is a view builder wearing a select menu — "Capabilities by
  Journeys" states no derivation and nothing is accountable for it. Domain is
  the only grouping axis, it is always on wherever the type carries one, and
  there is no control. Entities that act lead their collection in a group of
  their own, because who the Product is for is the question the rail is opened
  with.
- **A filter offers only what the row already prints.** A facet the reader
  cannot see on a card is a correlation they have to take on trust, and nine of
  them above a twelve-item list cost more than the scan they replace. Filters
  narrow; they never reach for a relation the reading does not already show.
- **One control per axis, inside the reading it narrows.** A single `Filter`
  button hid both which axes exist and the state of each, behind a click. Every
  axis gets its own control, on one scannable line, aligned with the rows it acts
  on rather than banded above them as chrome — narrowing belongs to the reading,
  where identity and the ways out belong to the surface. A control says how many
  values it holds, never which: the values sit on a second row, so the control
  line keeps a fixed width however much is selected, and each value keeps its own
  way out. A surface that narrows on unrelated axes — which types a view draws,
  and which resource it focuses — gets one control each, not one popover holding
  both.
- A view that needs a paragraph before it can be read is not ready to ship, and
  no view opens onto an empty configuration screen. It does not spend a row of
  the reading restating its own question either: the heading names the subject,
  the tab names the reading, and the question belongs with the derivation it
  qualifies, behind the view's own disclosure.
- **The surface names the resource type; the row does not repeat it**, and a
  fact appears once per screen.
- **A resource type's mark is reserved.** Chrome wears a kind's icon only where
  it names that kind — an exit to Rule attachments may carry the Business Rule
  mark, and a Capability on a lifecycle arc carries the Capability's. Anything
  else borrows a glyph that already means something: a control naming every type
  is not the Entity type, a Scenario's named route is not a Journey, and a Step
  kind is not a resource at all. Reach for an unreserved glyph instead.
- **Counts where the set is many, names where the set is one** — in rows,
  tables, and facts alike. Nothing renders an empty label: a missing hook or an
  empty facet set shrinks the element rather than reserving space for what is
  not there.
- **A teaching affordance can be turned off, and never hides the way back.**
  Term tooltips are dismissed from the tooltip and restored from the Vocabulary
  panel, which is never behind the preference; the choice is a cookie, so a
  server-rendered report draws it on the first paint.
- **A section renders as more than prose only when four things align**: a
  recognized H2 in `spec/format.md`; a **required content shape** — bullet list,
  H3 plus prose, or prose — enforced by `lint`; a typed field in
  `src/core/portable.ts`; and a component that reads it. The content shape is
  the row that gets skipped and the one that makes rendering possible. Where the
  UI cannot render it differently from prose, leave it in `supportingSections`,
  which round-trips losslessly.

## Change and release checks

- Keep changelog entries brief and nontechnical: state only user-visible outcomes.
- Run `npm run verify` after any change.
- Inspect `npm pack --dry-run` before a release.
- Roll the `[Unreleased]` section of `CHANGELOG.md` into a new version heading
  before dispatching a release.
- Validate every skill with the skill-creator `quick_validate.py`.
- Validate the Claude plugin with `claude plugin validate . --strict` when the
  Claude CLI is available.
- Keep `.claude-plugin/plugin.json` and `package.json` versions in sync.
- Do not publish, tag, or push unless explicitly asked.
