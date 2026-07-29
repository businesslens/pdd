# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- Files written by `open` use default umask permissions instead of owner-only
  `0600`, so an expanded model is readable by the whole team.
- Product Report validation now rejects content that cannot round-trip into
  canonical Markdown and inconsistent mapped-coverage counts. Product Model
  validation continues to reject non-draft behavioral claims without evidence.

### Added

- `businesslens open <report>` expands a local or trusted Hub `report.json`
  back into a canonical `.businesslens/` Product Model, making `build` and
  `open` semantic inverses. Remote sources are restricted to official Hub
  report URLs, refuse redirects, enforce an 8 MiB limit, and verify the
  advertised report digest before writing.
- `publish --tag` and `publish --pull-request` target tag and pull-request
  Tracks explicitly; ordinary publish targets the current branch Track.
- **Features** and **business rules** are first-class product-model entities
  with their own directories, IDs, relationships, and validation rules.
- A `businesslens/report` library entry point exporting the Product Report
  schema, its cross-entity validator, and the canonical digest. BusinessLens
  Platform consumes this contract instead of vendoring a parallel copy, so
  ingestion and delivery cannot drift from the framework. It depends only on
  `zod` and never loads the CLI.
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
