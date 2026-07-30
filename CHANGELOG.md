# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.0-alpha.1] - 2026-07-30

BusinessLens consolidates onto one site. The Platform is retired; the Blueprint
catalog moves to `businesslens.io` and becomes anonymous to browse and to pull.

**The breaking changes are smaller than they look.** npm's latest release was
`0.5.0` and `0.6.0` was never published, so `login`, authenticated `pull`, and
the `--platform` flag never reached a user — removing them withdraws an
unreleased feature rather than breaking an installed base. The only real break
against `0.5.0` is `build` → `export`, and the old name still works.

### Added

- `businesslens-implement` — build the software a Product Model describes, with
  its scenarios as the acceptance contract. This is the second half of the
  catalog's promise: `pull` gives you a specification, `implement` turns it into
  software.
- `businesslens-ideate` — propose candidate product directions as a shortlist.
  The only skill that never writes to the model.
- `blueprints/` — the Blueprint source layout, with a `blueprint.yaml` manifest
  and MIT-licensed content.
- `blueprints:check`, wired into `verify`: parses every manifest, builds every
  Blueprint, and rejects any that carries source evidence. It does not trust
  `contribute`, because anyone can open a pull request by hand.
- `blueprints:publish` — push built Blueprints to the catalog.
- `pull` now writes a greenfield block into `AGENTS.md`, telling a coding agent
  that the repository holds a specification and no implementation.
- `pull` sends `user-agent: businesslens/<version>`, so catalog pulls are
  distinguishable from page views.
- `resolveModelRoot` — the model no longer has to sit at the Git root, and may
  have no repository at all. General monorepo support, not a Blueprint case.

### Changed

- **`businesslens publish` is now `businesslens contribute`**, and opens a pull
  request against `businesslens/pdd` through the `gh` CLI rather than submitting
  to a Platform. No API key is involved. The model in the pull request is
  regenerated from a redacted report, so it carries no source paths and is
  byte-identical to what `pull` produces.
- **`businesslens build` is now `businesslens export`.** `build` still works and
  warns; it will be removed after 0.7.x. The output stays at
  `.businesslens/build/report.json`.
- **`pull` is anonymous.** No login, no credential, no `--version`.
- `--platform` is now `--catalog`, defaulting to `https://businesslens.io`, and
  accepts any origin — the allowlist existed to protect an API key the read path
  no longer sends. Precedence: `--catalog`, `BUSINESSLENS_CATALOG_URL`, default.
- `businesslens-publish` is now `businesslens-contribute`.
- Skill runners pin the CLI to the version the skills were installed from rather
  than `@latest`, which could validate a model against an older published
  format.

### Fixed

- Report expansion is idempotent. `open` appended its coverage limitation
  unconditionally, so every open/pull cycle gained another copy — which broke the
  guarantee that a pulled Blueprint matches what the catalog holds.

### Removed

- `businesslens login`, the stored credential file, and `BUSINESSLENS_API_KEY`.
- `pull --version` and Blueprint revisions. A Blueprint owns one Product Report.
- `platform.url` from the model config format.


## [0.6.0] - 2026-07-29

### Changed

- **Breaking.** `build` now emits a source-free **Product Report v4** at
  `.businesslens/build/report.json`, replacing the portable v3
  `project.json`. The report carries no repository URL, commit, branch, or
  workspace metadata.
- **Breaking.** `publish` submits to `/api/v4/projects` and sends the report and
  its Git provenance as two separate parts of one envelope. Every accepted
  publish reports a new immutable Product Model Version; it never creates or
  publishes a Blueprint as a side effect.
- **Breaking.** `.businesslens/` is now called the **Product Model** throughout
  the CLI, docs, and skills. "Product map" is reserved for a visual or
  navigable view of that model. Draft coverage is an evidence state and no
  longer implies a reusable blueprint.
- Product Report validation now rejects content that cannot round-trip into
  canonical Markdown and inconsistent mapped-coverage counts. Product Model
  validation continues to reject non-draft behavioral claims without evidence.

### Added

- `businesslens open <report>` expands a local Product Report back into a
  canonical `.businesslens/` Product Model, making `build` and `open`
  semantic inverses.
- `businesslens login` authorizes a dedicated CLI session through the browser,
  and `businesslens pull <blueprint-name> [--version N]` retrieves the
  latest or an exact Blueprint version and expands it without a user-facing
  `report.json` download.
- `publish --tag` and `publish --pull-request` target tag and pull-request
  Tracks explicitly; ordinary publish targets the current branch Track.
- **Features** and **business rules** are first-class product-model entities
  with their own directories, IDs, relationships, and validation rules.
- A `businesslens/report` library entry point exporting the Product Report
  schema, its cross-entity validator, and the canonical digest. BusinessLens
  Platform consumes this contract instead of vendoring a parallel copy, so
  ingestion and delivery cannot drift from the framework. It depends only on
  `zod` and never loads the CLI.
- `redactSourceEvidence` in the `businesslens/report` contract strips every
  repository reference from a report before it leaves its owning workspace —
  `codeRefs`, repository `entryPoints`, repository-relative `links`, and
  `coverage.sourceAreas` — so a downloadable or public Hub report never
  discloses the origin repository's layout, file paths, or symbol names.
  Product-facing routes and HTTP(S) URLs are kept. `coverage.mapped` is
  preserved as a model-quality signal, and `coverage.evidenceRedacted` records
  both that those counts describe the origin repository and that validation
  must reject any repository path still present.
- `businesslens-plan` and `businesslens-verify` skills for planning in the
  Product Model and verifying implementation evidence before merge.
- Draft greenfield product models, with missing-evidence warnings during
  planning and support for building and reporting planned Product Model
  Versions before implementation is complete.
- A structured open-source documentation section with tutorials, individual
  skill pages, and deterministic navigation frontmatter.
- `docs/terminology.md` defines every product-model entity and separates the
  terms that are easy to confuse.

### Fixed

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
