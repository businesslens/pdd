# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Co-located assets.** Files beside `<type>.md` are product assets owned by
  the entity; anything under the reserved `implementation/` directory
  describes this realization and stays home. Class comes from the path, which is
  the only rule a tool writing a capture on CI can satisfy. An optional
  `assets:` list titles and scopes those files without ever setting their class,
  and unlisted files stay legal.
- An optional `state:` on a reference or asset, valid only on a Screen and
  validated against its `## Product states`, so several captures of one view are
  placed beside the state each depicts instead of arriving as a flat list.
- An optional ordered `screens:` list on an Interface or Experience declaring
  reading order over its own children. Reachability stays with the tree.
- `businesslens view` serves repository files from a read-only, extension-
  allowlisted mount, and the report viewer renders local `visual` references and
  co-located assets as thumbnails instead of inert text.
- **Every entity has a page**, at its own URL, with the authored body at full
  width — steps, flow, routes, decision points, screen states and rule
  statements were previously readable only inside a 672px drawer. Kinds with no
  authored body of their own (Actor, Interface, Experience, Domain) get their
  neighbourhood graph as the page body, because their reach is the reading.
- **The inspector is a peek**: identity, one sentence, three discriminating
  facts, and what the entity connects to. It does not scroll, it is one level
  deep, and every relation on it opens that entity's page instead of
  re-targeting the panel.
- The open section and the open entity page live in the URL, so a report has
  deep links, a working browser back button, and a refresh that lands where it
  left. `BusinessLensReportViewer` exposes both as bindable models.
- Each collection states the question it answers and the derivation behind its
  reading order, in the vocabulary the named topology views already use.
- Every collection opens grouped by the containment the format declares for it,
  and says so when an entity relates to more than one group.
- Counterpart Screens, Experiences and Interfaces cross-link from their pages:
  the same thing on another Interface is named as such rather than appearing to
  be a duplicate row.
- One entity's neighbourhood is drawn on the topology canvas, at a width that
  can render it, instead of inside the panel.


- A new Learn from examples documentation group, beginning with a guided
  Content Feed Reader walkthrough that traces two complete Actor paths and
  explains why each optional entity earns its place.
- The stable Product Report Workbench: an entity-first browse, inspect, search,
  scenario, journey, and named-topology experience over one complete report
  projection. It renders every entity collection, availability scope, entry
  point, screen state, scenario step, decision point, edge case, reference,
  supporting section, coverage statement, and derived backlink.
- A shared Vue Flow foundation in the report-viewer layer (`@vue-flow/core` with a
  `@dagrejs/dagre` layered layout, both optional peer dependencies): one
  entity box and one container box for nine visual categories (with both
  Scenario types distinguished in content), a fixed relation-verb
  vocabulary, a measured Interface → Experience → Screen containment map, a
  sitemap of the same hierarchy drawn either as a top-down tree or radially
  from the Product core, and
  `BlrTopology` — the contextual neighbourhood graph with intentional
  expansion, kind filtering that fades rather than removes, re-rooting with a
  back trail, and a plain-words explanation of the selected entity.

### Changed

- **The report navigation rail lists kinds, flat.** Kinds do not nest —
  instances do — so both Scenario kinds leave the rail and become a tab on the
  Capability or Journey that owns them, which is the resolution the
  documentation already reached for a mandatory single parent. Ten destinations
  instead of twelve, and no indentation claiming a hierarchy the other eight
  rows have too.
- **Collection chrome scales with the collection.** The per-relation filter
  dropdowns collapse into one control with a chip per *active* filter, and it is
  not rendered at all below eight entities — seven dropdowns above four Journeys
  was a wall, not an offer. The card-style switcher is gone; the dense row is
  the only layout, and it carries the fact that distinguishes an entity from its
  neighbours (a Screen's scope, a Scenario's parent) where the repeated kind
  label used to be.
- Entity tables render the name of a relation the format makes single-valued
  rather than the count `1`, and drop any column constant across the rows on
  screen.
- **Folder schema 5 — a breaking change with no compatibility reader.** An
  entity is compact as `<id>.md` until it owns an asset or typed child
  collection, then expands to `<id>/<type>.md`. Both shapes derive the same id
  and cannot coexist. This keeps leaf-heavy collections readable while giving
  every kind—Screens most of all—a co-located namespace when needed.
  `product.md` similarly expands to `product/product.md` only when it owns
  `logo.svg`.
- **The surface tree nests.** An Experience belongs to exactly one Interface and
  a Screen to exactly one scope, so the path is the parent relation. An
  Experience no longer writes `interfaces:`, a Capability Scenario no longer
  writes `capability:`, a Journey Scenario no longer writes `journey:`, and a
  Screen no longer writes `availability:`. Reparenting is a `git mv` that reads
  correctly in a pull request.
- **`availability` collapses to a flat list of scope ids** such as
  `customer-web::storefront`, and one exact context becomes a single
  `context:` id. This removes the nested availability record, the `experiences`
  sub-list, the rule requiring an Experience when the Interface uses them, and
  the prohibition on mixing the two shapes — all four were consequences of an
  Experience being able to span Interfaces.
- **Surface-tree ids are qualified** by the path that distinguishes them.
  Surface names repeat across Interfaces on purpose: two entities of the same
  kind sharing a path suffix below their Interface are counterparts — the same
  thing on two surfaces. Behavior-tree ids stay bare and globally unique.
- **Domain is a subject axis, not a capability folder.** It now requires a
  `## Boundary` section, and only Capability authors `domain:` — a Screen's,
  Experience's or Journey's Domains are derived through their Capabilities
  rather than restated where a second copy could disagree.
- Product Report `schemaVersion` is `9.0.0`, and the catalog media type moves to
  `version=9`. There is exactly one accepted report version, as before.
- Scenario documentation moves onto its parent's page. A Scenario is not a
  top-level entity — it has a mandatory single parent that decides its kind —
  so Capability Scenarios are documented in `docs/capabilities.md`, Journey
  Scenarios in `docs/journeys.md`, and the containment rule that separates them
  in `docs/product-model.md`. The standalone `docs/scenarios.md` is removed.

- An external system is an Actor only when it **initiates** interaction with
  the Product, and only then is the surface it arrives through an Interface.
  Interfaces are inbound by definition; an outbound connection the Product
  opens to a third party — a polled feed, a payment processor, a mail provider,
  a model API — is not an Interface and its far side is not an Actor. Model the
  call inside the Capability that makes it, scope that Capability to the
  Interfaces where an Actor observes the result, and make its
  product-significant failure behavior a Capability Scenario. Direction, not
  ownership, is the axis: the same third party calling the Product back through
  a webhook is a genuine Actor with a genuine Interface. No entity type, folder
  schema, parser, or linter behavior changes — `lint` cannot recover direction
  from the files, so the rule lives in `spec/format.md`, the Product Model
  docs, and the mapping rubric.
- The Content Feed Reader Blueprint applies that rule. It drops the
  `feed-provider` Actor and the `syndicated-feed-integration` Interface;
  `feed-synchronization` now lives on the Reader-facing Interfaces where its
  result is seen, carries the RSS specification as a context Reference, and is
  triggered by a Reader-initiated refresh on the Source list Screen — a trigger
  the model previously never stated. Its catch-up failure variation no longer
  contradicts itself about whether the backlog was unchanged or caught up.
- **Breaking.** `businesslens/nuxt/report-viewer` now accepts the canonical
  `ProductReportV8` directly and owns the complete Workbench projection and
  topology engine. The lossy `businesslens/report/view-model` export and the
  whole-report `businesslens/nuxt/report-lab` audition layer were removed. The
  local viewer now ships only the promoted Workbench design while continuing
  to share the landing application's background audition flow through
  `businesslens/nuxt/theme-lab`.
- **Breaking.** Logo, lockup, and favicon selection are no longer theme-lab
  experiments. The approved mark, wordmark, brand renderer, favicon, and
  install-icon family now live at canonical paths in `businesslens/nuxt/theme`;
  `businesslens/theme-lab/variants` exposes background choices only.
- The Workbench now keeps entity identity collision-safe across collections,
  preserves focus across live recompiles, separates Capability and Journey
  Scenario readings, shows Screen-to-Journey derivation provenance, renders
  ordered Journey flow lanes, and uses fixed named views instead of a generic
  cross-kind grouping builder. Mobile navigation is a dedicated drawer.

- Schema 4 and Product Report v8 now separate Capability Scenarios from
  Journey Scenarios. Capabilities own local acceptance coverage; optional,
  route-free Journeys own only Actors, Goal, and Success criterion; Journey
  Scenarios own ordered, locally identified Capability/operation stages,
  correlated exact-context routes, and their terminal result. Business Rules
  use typed `appliesTo` targets with optional exact-context narrowing instead of
  parallel relation arrays or authored Domain links. Lint requires complete
  per-context Capability Scenario coverage, achieved coverage for every Journey
  Actor, goal-owner route entry, and exhaustive Interface Actor coverage across
  Experiences. The version identifiers remain unchanged because neither
  unreleased contract needs a compatibility reader.
- **Breaking.** Product Report v8 stores authored supporting H2 sections as
  ordered `{ heading, content }` records instead of an opaque
  `supportingContent` string. Schema 4 lint now rejects Journey and Scenario
  lead prose, duplicate or conflicting structured sections, malformed
  structured lists, and duplicate values in set-valued relation lists rather
  than allowing authored content to disappear or inflate derived relations.
- **Breaking.** Folder schema 4 and Product Report v8 make Experiences
  optional. Interfaces with no Experience contexts use direct availability;
  Interfaces with declared Experiences continue to require exact,
  non-empty Experience scopes. Schema 3 and Product Report v7 are no longer
  accepted.
- The Content Feed Reader catalog Blueprint now models three distinct access
  boundaries: Reader work, Visitor consumption, and external feed collection.
  It has three Actors, three Interfaces, two Experiences, three Domains, five
  Screens, ten Capabilities, twenty-four Capability Scenarios, four Journeys,
  eight Journey Scenarios, and four Business Rules. Domains group Capabilities
  on one axis — Sources, Reading, Collections — so no Capability needs its
  Domain's definition widened to admit it.
  It remains source-free; a future implementation can attach screenshots as
  external References without changing Product meaning.
- Both teaching models now demonstrate a Journey that is attempted and not
  reached. The Blueprint carries two `not-achieved` Journey Scenarios and the
  golden fixture one, so `result` is an axis with real values rather than a
  constant, and `failureOnlyCapabilityIds` is exercised against authored
  content instead of always deriving empty.
- The Workbench treats Capability Scenarios and Journey Scenarios as separate
  entity kinds rather than one kind carrying a type flag. Both appear in the
  navigation rail with their own browse surface, filters, table columns, and
  search group; a Journey Scenario table reports its terminal result beside
  its kind. Actors and Capabilities gained the Scenario backlinks that makes
  possible.
- Restored group-by on every browse surface, so authored Domains can group
  Capabilities and a Capability can group its Scenarios.

### Fixed

- The report panel no longer keeps its scroll offset when the entity changes.
  Selecting a relation that sat low in one reading opened the next one below its
  own title, id and lead.
- The local viewer resolves the Blueprint logo at `product/logo.svg`, where
  schema 5 puts it once the Product expands.
- An unexpected entry in a collection is now an explicit finding. A file nested
  one level too deep, or saved with the wrong extension, previously vanished
  from the model with no finding at all.
- The local viewer's Content-Security-Policy sets `manifest-src`, which was
  blocking `site.webmanifest`.


- The Workbench light and dark page surfaces are part of the shared theme
  again. The warm base, top glow, and paper grain moved from the optional
  theme-lab audition layer into `businesslens/nuxt/theme`, where the promoted
  Workbench and the bundled local viewer inherit them without depending on a
  lab layer.
- Value paths no longer implies a Screen is reached from a flow stage that
  cannot expose it. A Screen is authored against the whole Journey Scenario, so
  it now attaches to the last stage whose Capability actually declares that
  Screen and shares an availability context with it — a non-visual integration
  stage no longer appears to land on a Reader Screen.
- Value paths lays ordered stages downward with variations side by side. A
  left-to-right chain was wider than the canvas for a short Journey, so it
  scaled the whole graph down and left the height unused.

## [0.7.2] - 2026-08-05

### Added

- Add `--help` and strict option parsing to the Blueprint catalog publisher so
  its maintainer-only production flow is discoverable before a credential is
  configured.

### Fixed

- Open the `BL` ligature apart in the generated tab icons, so a browser tab shows
  two letters instead of one blob at 16px. Only the favicon family is respaced —
  the logo artwork and the larger app icons keep the ligature as drawn.
- Restrict the Blueprint publisher credential to the exact production catalog
  origin or a loopback development origin, preventing a mistaken `--catalog`
  value from sending it to an arbitrary HTTPS host.

## [0.7.1] - 2026-08-04

### Fixed

- Compile the public `businesslens/theme-lab/variants` subpath into `dist` so
  plain Node consumers such as Playwright can import it from `node_modules`
  without relying on unsupported TypeScript stripping.

## [0.7.0] - 2026-08-04

### Added

- `businesslens view` renders the current Product Model privately on localhost,
  recompiles automatically after debounced source edits, streams revisions to
  open browsers, retains the last valid report during lint errors, writes no
  generated report, and opens no network listener beyond `127.0.0.1`.
- Root `businesslens` exports for the pure Product Report view-model projection,
  the shared Nuxt report renderer, and a sibling BusinessLens-wide theme Layer,
  so hosts share UI without a second public npm package.
- An opt-in shared Nuxt theme-lab Layer for auditioning the same backgrounds,
  marks, lockups, and favicon families across the landing site and local report
  viewer without promoting undecided presentation into the stable theme.
- An optional `.businesslens/logo.svg` Product logo used by the local viewer and
  Blueprint presentation.
- First-class Interface entities for supported Product interaction contracts,
  with exact Interface–Experience availability across Capabilities, Journeys,
  Screens, Scenarios, and Business Rules.
- Required Actor classification as `person|system` and `external|internal`.
- Platform-neutral Screen entities for meaningful web and mobile product views,
  including product-visible information, actions, states, capability boundaries,
  relationships, and optional public routes or deep links.
- Universal References on every semantic entity, with independent artifact
  kinds (`code|spec|proposal|doc|adr|visual|research`) and attachment roles
  (`intent|implementation|context`). Referenced content stays outside the
  Product Model and never replaces its prose or proves alignment.
- `businesslens-map` for initial adoption, scoped remapping, and deliberate
  Product Model coverage expansion without executing target code.
- `businesslens-verify` as the single post-build invocation. It classifies
  model/code gaps, negotiates only authority decisions, automatically runs
  internal intent-resolution or scoped-mapping phases, hands code corrections
  to a harness-injected builder, and re-verifies until aligned or blocked.
- `report only` verification mode, an explicit missing-builder handoff, and an
  unchanged-gap stopping rule. Verification findings are re-derived rather than
  persisted in a receipt or ledger.
- Accepted decisions covering repository-owned files, unified References,
  non-persisted verification, and the three-skill boundary.

### Changed

- The CLI now uses a real hierarchical command parser with concise root help,
  command-specific options, nested Blueprint help, standard `-h`/`-V` flags,
  strict option ownership, and usage validation before command execution.
- `-c, --cwd` now always means "run from this directory". A model directly in the
  current directory wins over the Git-root model whether or not `--cwd .` was
  typed explicitly.
- **Breaking.** A catalog Blueprint has no separate `blueprint.yaml`. Product
  ID, title, summary, description, category, tags, authors, license, and report
  content come from `product.md`; visual identity comes only from
  `.businesslens/logo.svg`, and catalog operational state remains outside the
  Product Model.
- **Breaking.** Product Report v7 is the only accepted report contract. It
  carries portable Product identity and attribution, uses `summary` for the
  short Product description, and renames computed entity totals to `counts`.
- **Breaking.** `blueprint contribute` no longer accepts `--slug`; the Product
  ID is the canonical contribution directory, branch suffix, catalog slug, and
  pull name.

- **Breaking.** Folder schema 3 and Product Report v7 are now the only accepted
  formats. Schema 1/2, Product Report v4/v5/v6, and their compatibility paths are
  removed rather than migrated.
- **Breaking.** Feature is renamed Capability throughout the folder format,
  parser, SDK, CLI, skills, docs, fixtures, and Blueprint. `features/` is
  rejected; Capabilities live in `capabilities/`.
- **Breaking.** Experiences now declare their Interfaces and no longer carry
  `exit`. Journeys use Capabilities and exact availability, may cross Domains,
  and no longer declare one Domain. Business Rules exclusively own Rule scope.
- Domains are optional Capability groupings. Screens remain optional and now
  use exact availability without embedding visual evidence.
- The bundled Content & Feed Reader Blueprint now demonstrates the complete
  model, including cross-platform Screens, product states, mobile deep links,
  and external visual and research references.
- **Breaking.** The public skill set is exactly `businesslens-map`,
  `businesslens-ideate`, and `businesslens-verify`. Ideate also handles a narrow
  already-decided verification handoff without reopening broad brainstorming.
- **Breaking.** `businesslens validate` is now `businesslens lint`. The old
  spelling is refused with exit code 2 and a replacement message; it is not an
  alias. Lint output contains only `ok`, `errors`, `warnings`, and `counts`—no
  branch situation or authority inference.
- **Breaking.** `references` replaces both `codeRefs` and `links`. Reference
  records are strict, duplicate targets fail lint, code targets require tracked
  files, and missing local non-code targets warn.
- `coverage.status` now describes model breadth only: `draft` while the model
  itself is under review, `partial` with known unmapped areas, and `complete`
  when intended product scope is modeled. A complete model may have zero
  References.
- **Breaking.** Product Report v7 declares a `workspace` or `portable` Reference
  profile. Portable projection replaces evidence-redaction terminology and
  keeps only HTTP(S) intent/context References.
- **Breaking.** Coverage no longer contains counts, mapped entities, or a
  redaction flag. Entity totals live only in Counts; Coverage is independent
  from References. Blueprint open and pull preserve model breadth while
  removing repository-local Coverage source areas.
- Every model creation path carries canonical orientation in
  `.businesslens/README.md`. BusinessLens still never writes target-root
  `AGENTS.md`, `CLAUDE.md`, or README files.
- Canonical report expansion now owns that orientation file for `open`, `pull`,
  and `contribute`; Blueprint contributions accept every valid model-breadth
  Coverage status and publish no source-repository provenance.
- Lint now requires the complete committed model shell (`README.md` plus a
  `.gitignore` covering `build/` and `cache/`), and CLI argument, provider,
  scope, slug, and catalog-origin errors consistently exit with usage code 2.
- Documentation now teaches three starting doors and one ongoing loop:
  `ideate → injected build → verify (including final lint) → merge`. Map is explicitly not a
  daily maintenance command, and lint is explicitly not semantic verification.

### Fixed

- Product logos are parsed as namespace-aware XML and restricted to a static SVG
  allowlist, closing namespace-prefix and escaped-reference paths around the
  active-content checks. Logo responses from the local viewer also carry a
  script-free sandbox CSP.
- `blueprint pull` retrieves the optional logo from the selected catalog's
  same-origin endpoint, so custom catalogs and commit-pinned reports cannot be
  paired with the current logo from the official PDD `main` branch.
- Releases tag an already prepared package and changelog exactly once; the tag
  push is now the single automatic publication trigger.

### Removed

- `businesslens-init`, `businesslens-sync`, `businesslens-doctor`, and
  `businesslens-deep-dive`. Their useful scopes now belong to map or verify.
- The `businesslens-contribute` skill. Catalog contribution remains the
  deterministic `businesslens blueprint contribute` CLI command.
- Git branch-state routing from lint and the internal `branch-state` module.

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
  than resolving the latest published version, which could validate a model
  against an older published format.

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

[Unreleased]: https://github.com/businesslens/pdd/compare/v0.7.2...HEAD
[0.7.2]: https://github.com/businesslens/pdd/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/businesslens/pdd/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/businesslens/pdd/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/businesslens/pdd/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/businesslens/pdd/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/businesslens/pdd/releases/tag/v0.4.0
