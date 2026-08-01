# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed

- **`businesslens-verify`** — folded into `businesslens-sync`. The two were
  distinguished only by whether a plan existed, which the tool now derives from
  git rather than asking you to remember. Worse, `verify` and `validate` are
  synonyms in ordinary English, and the textbook distinction is *inverted*
  here: `validate` checks the model against a specification (verification by
  the book) while `verify` checked the code against intent (validation by the
  book). A reader who knew the convention got them backwards.

  Nothing is lost. `sync` does everything `verify` did when a plan exists,
  including deriving deletions from the model diff and proving retired
  behavior is gone.


- **`businesslens-validate`** — 55 lines that ran `npx businesslens validate
  --json` and reformatted the output. Run the CLI directly; a green result
  needs no narration, and `businesslens-doctor` explains a failing one far
  better, having already run the same command.
- **`businesslens-implement`** — the greenfield `AGENTS.md` block states its
  entire content, and states it to spec-driven toolchains and freestyle
  sessions too, which a skill never reaches. Writing the code was never
  BusinessLens's job; stating the acceptance contract is.
- **`businesslens-plan`** — folded into `businesslens-ideate`. Deciding what to
  build and writing that decision into the model are one converging
  conversation, not two skills; nothing enters `.businesslens/` without
  explicit approval either way.

BusinessLens now ships **six** skills: `init`, `ideate`, `sync`, `deep-dive`,
`doctor`, and `contribute`. Every removed name is listed as a legacy skill, so
`businesslens update` clears it from existing installations rather than leaving
it behind. None of this changes what a Product Model looks like or how it is
validated.

- **The brownfield `AGENTS.md` block.** `businesslens-init` and
  `businesslens-plan` no longer write to `AGENTS.md` at all. One managed block
  survives — the greenfield one — and only the CLI writes it. See
  [adr/0001](./adr/0001-drop-the-brownfield-agents-block.md).

  This also fixes a bug: `businesslens-plan` handled *new products* and
  inserted the **brownfield** block, telling agents to read `codeRefs` for
  current behavior in a repository that had neither code nor `codeRefs`.

### Fixed

- **`contribute` no longer branches off a stale fork.** A fork left from an
  earlier contribution kept whatever default branch it had then, and nothing
  synced it — so a second contribution could open a pull request carrying
  unrelated commits or a conflict. The fork's default branch is now brought up
  to date from upstream before branching, and the command stops rather than
  proceeding if that fails.
- **`contribute` can be run twice for the same Blueprint.** The
  `blueprint/<slug>` branch is force-pushed — it is owned by the command on the
  contributor's own fork — and an already-open pull request is reported and
  updated instead of failing.
- `contribute` no longer depends on the fork's directory name to find its
  checkout, which broke for anyone who had renamed theirs. It forks with
  `--clone=false` and clones by name into a path it controls.
- `contribute` now says that forking left a repository behind, and that GitHub
  needs it until the Blueprint is merged.

### Changed

- **A Product Report has two profiles**, and *source-free* is one of them
  rather than a separate kind of artifact:

  - **source-free** (`coverage.evidenceRedacted: true`) — no `codeRefs`, no
    repository-relative links or entry points. Required whenever a report
    crosses an ownership boundary, and the only profile the catalog accepts.
  - **evidenced** — `codeRefs` intact, for a full product instance inside the
    boundary that owns the code.

  **Blueprint** keeps its existing meaning: a Product Report curated into the
  public catalog, under a slug. See
  [adr/0003](./adr/0003-source-free-is-a-report-profile.md), which supersedes
  ADR-0002 and withdraws the short-lived **Catalog Entry** term.

  No behavior changes: `blueprint export` still redacts, and the wire contract
  is untouched. This restores agreement with the landing repository's
  `CONTEXT.md`, which requires the two glossaries to match.
- **`export`, `open`, `pull`, and `contribute` moved under `businesslens
  blueprint`.** Each of the four produces or consumes a Blueprint — export
  makes one, open consumes one, pull fetches one, contribute submits one — and
  all of them carry a model across a repository boundary, which is a different
  job from the everyday `install` / `update` / `validate` verbs. The top level
  is now three commands you run constantly plus one noun for the occasional
  work.

  **The bare spellings are removed, not deprecated**, along with `build`. Each
  is refused with a message naming its replacement. Keeping `export` as an
  alias would have blocked reusing that name for the evidenced report profile,
  and reusing it while an alias existed would silently change what a
  disclosure-relevant command emits.
- **`blueprint export` now strips source evidence.** Every export produces a
  Blueprint: no `codeRefs`, no repository-relative links or entry points, and
  `coverage.evidenceRedacted` set. `contribute` and `open` each redacted
  separately before, so the artifact in `build/report.json` was the one shape
  nothing actually consumed. Coverage keeps its `mapped` counts, so a Blueprint
  still records how much of the original model was evidence-backed.

  If you were reading `build/report.json` to link a rendered model back to
  source, that no longer works — read `.businesslens/` directly instead.
- `businesslens open` now writes the greenfield `AGENTS.md` block, matching
  `businesslens pull`. Both are the "this model came from another repository"
  door, and a model with no implementation needs a note saying so.

### Added

- **`validate` now reports where you stand**, after the findings: which of the
  two things that can change — the model or the code — has changed on this
  branch, and what that means.

  This is a second answer, not a change to the first. **The exit code is
  untouched**: whether the model is *sound* and where you *stand* are different
  questions, and only the first gates a merge. A model whose code moved out
  from under it still validates green — that drift is semantic and no rule can
  see it, which is exactly the gap this covers.

  Uncommitted and untracked files count, so it works mid-change. It is skipped
  whenever the answer cannot be trusted: outside a repository, before the first
  commit, or in a shallow clone with no merge base.
- **`validate --json` gains an additive `branch` key** carrying that state,
  including a `situation` of `at-rest`, `planned`, `implemented`, or
  `unplanned-code`. `ok`, `errors`, `warnings`, and `counts` are unchanged.
- **`businesslens-sync` resolves what it cannot decide alone, one question at a
  time.** It separates every finding into *proof* — the code already does what
  the model says, so only `codeRefs` change — and *decisions*, which are
  anything that would alter what the model or the code says. Proof is attached
  and reported. Decisions are sorted so that answering one settles the ones it
  determines, asked individually with a recommendation, and re-derived from a
  fresh validation run after every answer, until nothing is left.

  Nothing about what your product *does* changes without you saying so.
- **Find your flow** (`docs/flows.md`) — a routing page covering every
  situation a Product Model can be in. Brownfield, greenfield, and
  greenfield-from-a-Blueprint each get a starting row; after the first
  evidence is attached they converge on one four-row matrix built from the
  only two things that can change, the model and the code.

## [0.6.0] - 2026-07-31

BusinessLens consolidates onto one site. The Platform is retired; the Blueprint
catalog moves to `businesslens.io` and becomes anonymous to browse and to pull.

The previous published npm version is `0.5.0`. An intermediate draft of this
release included authenticated Platform workflows, but it was never published;
the final `0.6.0` replaces those workflows with the anonymous catalog and the
pull-request contribution flow described below.

### Added

- `businesslens open <report>` expands a local Product Report back into a
  canonical `.businesslens/` Product Model, making `export` and `open`
  semantic inverses.
- `businesslens pull <blueprint-name>` anonymously retrieves a Blueprint and
  expands it without a user-facing `report.json` download. It writes a
  greenfield block into `AGENTS.md` and sends
  `user-agent: businesslens/<version>` to the catalog.
- **Features** and **business rules** are first-class product-model entities
  with their own directories, IDs, relationships, and validation rules.
- A `businesslens/report` library entry point exporting the Product Report
  schema, its cross-entity validator, and the canonical digest. It depends only
  on `zod` and never loads the CLI.
- `redactSourceEvidence` in the `businesslens/report` contract strips every
  repository reference from a report before it leaves its owning workspace —
  `codeRefs`, repository `entryPoints`, repository-relative `links`, and
  `coverage.sourceAreas`. Product-facing routes and HTTP(S) URLs are kept.
  `coverage.mapped` remains a model-quality signal, and
  `coverage.evidenceRedacted` records both that those counts describe the
  origin repository and that validation must reject any repository path still
  present.
- `businesslens-plan` and `businesslens-verify` skills for planning in the
  Product Model and verifying implementation evidence before merge.
- `businesslens-implement` builds the software a Product Model describes, with
  its scenarios as the acceptance contract.
- `businesslens-ideate` proposes candidate product directions as a shortlist.
  It is the only skill that never writes to the model.
- Draft greenfield product models, with missing-evidence warnings during
  planning and support for exporting planned Product Model Versions before
  implementation is complete.
- `blueprints/` — the Blueprint source layout, with a `blueprint.yaml` manifest
  and MIT-licensed content.
- `blueprints:check`, wired into `verify`, parses every manifest, builds every
  Blueprint, and rejects any that carries source evidence. It does not trust
  `contribute`, because anyone can open a pull request by hand.
- `blueprints:publish` pushes built Blueprints to the catalog.
- `resolveModelRoot` allows the model to live outside the Git root or without a
  repository, adding general monorepo support.
- A structured open-source documentation section with tutorials, individual
  skill pages, and deterministic navigation frontmatter.
- `docs/terminology.md` defines every product-model entity and separates the
  terms that are easy to confuse.

### Changed

- **Breaking.** `businesslens publish` is now `businesslens contribute`, and
  opens a pull request against `businesslens/pdd` through the `gh` CLI rather
  than submitting to a Platform. No API key is involved. The model in the pull
  request is regenerated from a redacted report, so it carries no source paths
  and is byte-identical to what `pull` produces.
- **Breaking.** `businesslens build` is now `businesslens export`. `build` still
  works and warns; it will be removed after 0.6.x.
- `export` emits a source-free **Product Report v4** at
  `.businesslens/build/report.json`, replacing the portable v3 `project.json`.
  The report carries no repository URL, commit, branch, or workspace metadata.
- **Breaking.** `.businesslens/` is now called the **Product Model** throughout
  the CLI, docs, and skills. "Product map" is reserved for a visual or
  navigable view of that model. Draft coverage is an evidence state and no
  longer implies a reusable Blueprint.
- Product Report validation rejects content that cannot round-trip into
  canonical Markdown and inconsistent mapped-coverage counts. Product Model
  validation continues to reject non-draft behavioral claims without evidence.
- `--catalog` defaults to `https://businesslens.io` and accepts any origin.
  Precedence is `--catalog`, `BUSINESSLENS_CATALOG_URL`, then the default.
- `businesslens-publish` is now `businesslens-contribute`.
- Skill runners pin the CLI to the version the skills were installed from rather
  than `@latest`, which could validate a model against an older published
  format.

### Fixed

- Report expansion is idempotent. `open` appended its coverage limitation
  unconditionally, so every open/pull cycle gained another copy and broke the
  guarantee that a pulled Blueprint matches what the catalog holds.
- Docs dispatch sends an immutable commit-pinned revision to the landing
  pipeline ([#2](https://github.com/businesslens/pdd/pull/2)).

## [0.5.0] - 2026-07-26

### Added

- `build` and `publish` CLI commands, the `businesslens-publish` skill with its
  isolated runner, and the CI publishing recipe
  ([#1](https://github.com/businesslens/pdd/pull/1)).

## [0.4.0] - 2026-07-26

Initial public launch of the repository.

### Added

- CLI: `install`, `update`, and `validate` commands.
- Agent skills: `businesslens-init`, `businesslens-sync`,
  `businesslens-deep-dive`, `businesslens-validate`, and
  `businesslens-doctor`.
- The `.businesslens/` product-map format and its contract in
  `docs/format.md`.
- Claude plugin manifest and marketplace entry.

[Unreleased]: https://github.com/businesslens/pdd/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/businesslens/pdd/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/businesslens/pdd/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/businesslens/pdd/releases/tag/v0.4.0
