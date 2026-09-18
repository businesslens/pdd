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
  Only documented commands and options are accepted. Removed spellings use
  normal usage errors; there are no hidden migration commands or scope aliases.
  Before launch, publication or installation alone does not require historical
  behavior. Coordinate current producer and consumer changes together.
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
- **`docs/` explains the model, never the report.** A derivation is a fact about
  the model and belongs here; the surface that draws it does not.
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

- **The rendered report is for humans only.** An agent that needs the model
  reads `.businesslens/` directly.
- **Every authored field has a visible home.** Use the model's field names and
  show source paths alongside content. Keep derived statistics separate from
  authored meaning. Detailed viewer behavior and host APIs belong in the
  [report layer README](layers/nuxt/report-viewer/README.md).
- **The report explains itself.** A reading that needs prose elsewhere to be
  understood is not finished. It links out only to the documentation for a
  resource *type*.
- **A collection is one set with two drawings.** The rail changes the subject,
  the filters narrow the set, and a Rows/Graph switch beside the filters changes
  only how the same set is drawn: the heading count, the controls and the chips
  are identical in both. Each collection's Graph states one derivation and is
  accountable for it. Tabs exist only on the Overview and in resource readings,
  where they change which set is on screen.
- **Row density is the reader's, per collection.** How many columns the Rows
  drawing uses is a cookie keyed by collection, so the first paint is right;
  nothing else about a drawing is configurable. Phones use one column and hide
  the density control without changing the saved preference. Expand all and
  Collapse all stay directly beside the drawing controls at every width.
- **Every surface names itself, with the name the reader clicked.** The main
  H1 keeps the working view and its count or Product qualifier. A resource
  slideover names its resource and type, with actual ownership shown separately
  from the return trail. Report identity and the way home stay in the sidebar.
- **Resources open in one complete slideover.** This supersedes the resource-page
  navigation rule. Opening a row, relation, search result or diagram resource
  preserves the underlying section, drawing, filters, expansion and viewport.
  The resource and its tab have an address independent of the working view.
  Back restores the previous resource reading; Close returns to the working
  view. The slideover dims and blocks the background; clicking outside or
  pressing Escape closes it and restores the working view. Narrow screens use
  the full width. Refresh and valid recompilation preserve the reading.
  Expand fills the window with the same resource reading; Restore returns to
  the panel width without losing its drawing, selected detail or graph viewport.
- **Review compares Git states without writes.** Model and project files share
  one changed-file tree. Missing or invalid models limit resource links, never
  file comparisons; historical readings use the selected commit.
- **The rail lists Overview, three cross-collection views, then six
  collections.** The views — Compare delivery, What changes what, Rule
  attachments — each compare two collections, so no collection owns them and
  each is a row of its own. The collections are Entities, Interfaces, Domains,
  Capabilities, Journeys, Business Rules. Experiences and Screens are reached
  through Interfaces, Scenarios through their parent, and a collection's Graph
  through its drawing switch.
- **A resource reading separates meaning, behavior, connections and references.** Overview
  carries the resource's explanation and contextual links, including an Entity's
  Information kept. Scenarios follows for a Capability or
  Journey, Lifecycle for an Entity with States. Lifecycle switches between Rows
  and Graph; selecting a change reads its Rules and supporting Scenarios, and
  selecting a State reads its definition and the Scenarios that leave it there.
  Rows uses the collection list's parent/child styling: each State contains its
  definition and outgoing changes, including States with none. Creation and
  changes without a starting State have separate groups. This supersedes placing
  State definitions in Overview or stacking separate State cards below the graph.
  Changes without specified states remain accessible beside the graph.
  Connections
  follows when relationships exist and includes the complete relationship
  list, including links also explained in Overview. References comes last when
  attachments exist, with a count and attribution to the inspected resource,
  including a Scenario's own attachments. This supersedes the limit
  of one peer tab. A view comparing resources belongs to the collection, never
  to one of them.
- **The Product's page is the report Overview** — headed `Overview` like the
  rail row that opens it and qualified by
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
  two reports differ for a reason no reader can see. On phones, and whenever
  inline filters plus actions would wrap, a Filters button opens those same axis
  controls in a bottom sheet; its badge counts selected
  values, and individually removable chips remain above the reading. Rows/Graph
  stays beside Filters with the same icons. Page controls, filters and graph
  buttons use Nuxt UI's `sm` size (28px) at every viewport width. Host chrome
  retains its own sizing; report controls never override global UI defaults.
  Filter collapse follows the reading's available width. Report navigation
  sits beside the working view's heading.
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
