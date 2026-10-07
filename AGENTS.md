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
  `completion`, and the `blueprint` namespace (`export`, `open`, `pull`,
  `contribute`). Only documented commands and options are accepted. Removed
  spellings use normal usage errors; there are no hidden migration commands or
  scope aliases. The one internal entry, `__complete`, is the protocol the
  printed completion scripts call on Tab: it reads the Commander tree before
  parsing and is not a command. Declare how a new option or argument value
  completes beside its definition (`completes()` in `src/core/completion.ts`).
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
- `test/fixtures/fixture-shop/` — the golden lint fixture. `pnpm view:fixture`
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
  Model (one page per main resource family), Skills (one page per skill), and
  CLI (one page per command). The Introduction draws the development loop
  (embedded on the site as `::development-loop`, with a plain-text fallback);
  implementing is the user's own workflow, so there is no Integrations group.
- **`docs/` gives the gist; the skills carry the complexity.** A reader should
  understand a resource type from its page in a few minutes. Each resource type
  is explained in exactly one place, in this order: a one-sentence definition;
  everyday examples; when to create one, as a few rules of thumb; one minimal
  example file with its fields; how it connects; and the `lint` findings that
  constrain it, errors and warnings marked. The full rules, edge cases and
  case law live in `spec/format.md` and each skill's format reference, never in
  `docs/`. Do not reintroduce a separate glossary, format page, or error
  catalog. Aim for 120–250 lines per Product Model page.
- **`docs/` explains the model, never the report.** A derivation is a fact about
  the model and belongs here; the surface that draws it does not.
- Define vocabulary in the owning doc's `terms:` frontmatter. Run
  `pnpm vocabulary` after edits and commit the generated registry.
- Keep definitions self-contained and capitalize referenced types. Put the page's
  main term first; CLI pages do not declare terms.
- Experiences and Screens are sections of `docs/interfaces.md`, including their
  definitions, file shapes, and lint rules. They have no separate docs pages or
  sidebar entries. Capability Scenarios live in `docs/capabilities.md`, Journey
  Scenarios in `docs/journeys.md`.

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
  every boundary deciding how many resources exist gets one plain rule of thumb
  with an example in `docs/`: a resource type whose granularity cannot be
  challenged from `docs/` is a candidate for removal. The exhaustive statement
  stays in the spec.
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
  execute target code. The builder is the agent the user asked to implement:
  it implements each phase of the plan in the user's own way of working, under
  its normal permissions, and may run target code there; that implementation
  work is the user's workflow, not BusinessLens analysis. When the user
  implements elsewhere, verify stops with a complete handoff packet.
- **The user talks to their agent; skills are found by description.** A user
  asks to change the product or to implement it, never names a skill. Ideate's
  description must catch product-change requests and verify's must catch
  implement requests (and "build", which users also say) as well as checks;
  invoking verify by hand is for when the user is unsure.
- **Implementation runs in phases; checking runs per slice.** A slice is one
  Capability or Journey; a phase is the slices whose needs are already met.
  Phases are the default pace; the user may ask for one slice at a time or for
  everything in one go. The pace never changes what is checked.
- Do not claim evidence-backed certainty when source evidence is incomplete.
- **Delegated decisions are not approval.** Every skill that writes product
  meaning writes it only after the user approves the complete delta it
  presented. "Take your recommendation" settles the open questions; the skill
  still presents the resulting delta and waits.
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
- **It is a place you go, not a document you read.** Completeness is a cost:
  every field rendered competes with the one answering the question the reader
  arrived with. Where it omits, it names the file path.
- **The report explains itself.** A reading that needs prose elsewhere to be
  understood is not finished. It links out only to the documentation for a
  resource *type*.
- **A collection is one set with shared drawings.** The rail changes the subject,
  the filters narrow the set, and a Rows/Graph/Matrix selector beside the filters
  changes only how the same set is drawn: the heading count, controls and chips
  stay the same. Each collection's Graph states one derivation and is accountable
  for it. Tabs exist only on the Overview and in resource readings, where they
  change which set is on screen. Filter and control details belong in the
  [report viewer README](layers/nuxt/report-viewer/README.md).
- **Row density is the reader's, per collection.** How many columns the Rows
  drawing uses is a cookie keyed by collection, so the first paint is right;
  nothing else about a drawing is configurable. Phones use one column and hide
  the density control without changing the saved preference. Expand all and
  Collapse all sit beside the drawing controls on desktop and inside the view
  picker on phones.
- **Every surface names itself.** The main H1 keeps the working view and its
  count or Product qualifier. A resource slideover names its resource and type,
  with actual ownership shown separately from the return trail. The name the
  reader clicked is on the title line: as the title, as the Variation picker's
  value, or, for a Scenario, as its card inside the parent's reading, which is
  what a Scenario address opens. Report identity and the way home stay in the sidebar.
- **Resources open in one complete slideover.** Opening a row, relation, search result or diagram resource
  preserves the underlying section, drawing, filters, expansion and viewport.
  The resource and its tab have an address independent of the working view.
  Back restores the previous resource reading; Close returns to the working
  view. The slideover dims and blocks the background; clicking outside or
  pressing Escape closes it and restores the working view. Narrow screens use
  the full width. Refresh and valid recompilation preserve the reading.
  Expand fills the window with the same resource reading; Restore returns to
  the panel width without losing its drawing, selected detail or graph viewport.
- **The rail lists Overview, then seven collections.** Matrix comparisons live
  within the collection supplying their rows. The collections are Entities,
  Interfaces, Domains, Capabilities, Journeys, Business Rules, Variations.
  Experiences and Screens are reached through Interfaces, Scenarios through
  their parent, and a collection's Graph or Matrix through its drawing selector.
  Variations has Rows only.
- **A Variation reads as the type it varies, and leads its alternatives.** A
  set wears its member type's mark with the variation sub-icon; the glyph alone,
  in ink, marks only the Variations collection. Wherever an alternative is a
  title, its Variation is the title and a picker beside it names and switches
  the alternative; switching in a reading header replaces the reading. Nothing
  switches alternatives with tabs. Alternatives meeting in a list are one set
  row; a tree folds them under the set's node; references inside a reading stay
  concrete; headings count concrete resources. Drawings keep concrete nodes and
  add the set around them, dashing what only some alternatives support. Details
  are in the [report viewer README](layers/nuxt/report-viewer/README.md).
- **A resource reading separates meaning, behavior, connections and
  references.** Overview carries the resource's explanation and contextual
  links; behavior tabs follow (Scenarios for a Capability or Journey, Lifecycle
  for an Entity with States, Applies to for a Business Rule, Alternatives for a
  Variation, Delivery for a place); Business Rules lists the Rules naming the
  resource; Connections carries the complete relationship list; References comes
  last when attachments exist. A Scenario is read on its card inside its
  parent. A view comparing resources belongs to the collection, never to one of
  them. Tab order and contents are in the viewer README.
- **The Product's page is the report Overview** — headed `Overview` like the
  rail row that opens it and qualified by
  `Product`. Its readings are About, Coverage and References, and it never
  reprints a collection that has a rail row of its own.
- **Named views, not a view builder.** A named view picks one derivation, states
  it, and is accountable for it. A new correlation costs code, which is the
  point.
- **Grouping is authored, never configured.** Domain is the axis, always on
  where the type carries one. Entities that act lead their collection. The
  Variations collection alone groups by the type each set varies — its authored
  `of` — because a Variation carries no Domain.
- **One filter control per axis, inside the reading it narrows**, offering only
  what the row already prints. A control says how many values it holds, never
  which; the values sit on a second row, each with its own way out. It is absent
  only when there is nothing behind it — never on a size threshold, which makes
  two reports differ for a reason no reader can see. On phones, and whenever
  inline filters plus actions would wrap, a Filters button opens those same axis
  controls in a bottom sheet; its badge counts selected
  values, and individually removable chips remain above the reading. The drawing switch
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
- **Coverage and References are read by location.** Each recorded path or
  referenced location appears once in a tree and discloses its statements or
  citations when asked; a folder never inherits meaning from beneath it. Their
  category and kind cards are fixed sets that read zero, and search matches
  paths and links, never prose. Coverage records only which code the model
  accounts for, so every entry has a location; a model tied to no code yet has
  empty coverage, and its reading says so in one plain statement.
- **A teaching affordance can be turned off, and never hides the way back.**
  Term tooltips are restored from the Vocabulary panel; the choice is a cookie,
  so the first paint is right.
- **A section renders as more than prose only when four things align**: a
  recognized H2 in `spec/format.md`; a lint-enforced content shape; a typed
  field in `src/core/portable.ts`; and a component that reads it. Otherwise it
  stays in `supportingSections`, which round-trips losslessly.

## Change and release checks

- Keep changelog entries brief and nontechnical: state only user-visible outcomes.
  Group them under Keep a Changelog's `### Added`, `### Changed`, `### Fixed`
  and `### Removed`; an optional bold area label (`**Report:**`, `**CLI:**`,
  `**Skills:**`, `**Docs:**`) may lead an entry.
- `CHANGELOG.md` is the only authored changelog. businesslens.io renders it as-is
  from `main`, pulled with `docs/`, one timeline card per dated release;
  `[Unreleased]` is never shown there. Every release heading keeps its link
  definition at the bottom of the file, and every release closes with
  `### Contributors` and a `**Full Changelog**` line (enforced by
  `scripts/check-repo.mjs`).
- Write an entry under `[Unreleased]` in the pull request that makes the change,
  with no links: the pull request and commit are added when the release is
  rolled.
- The repository installs with pnpm, pinned in `packageManager`;
  `pnpm-lock.yaml` is the only lockfile. Consumers install the published
  package with any package manager, so the Publish smoke test keeps both npm
  and pnpm consumers, and installed skill runners keep using npm to run the
  published package in target repositories.
- Run `pnpm verify` after any change.
- Inspect `pnpm pack --dry-run` before a release.
- Prepare a release in its own pull request that only rolls the changelog and
  bumps the version: `pnpm version <version> --no-git-tag-version`, fetch, then
  `pnpm changelog:release`. It blames each `[Unreleased]` entry at
  `origin/main` and appends the merged pull request and commit that added it,
  then writes the contributors, the Full Changelog line and the compare links.
  It refuses an entry the release pull request itself wrote, because that
  commit has no hash until it merges.
- Validate every skill with the skill-creator `quick_validate.py`.
- Validate the Claude plugin with `claude plugin validate . --strict` when the
  Claude CLI is available.
- Keep `.claude-plugin/plugin.json` and `package.json` versions in sync.
- Do not publish, tag, or push unless explicitly asked.
