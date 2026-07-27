# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/businesslens/pdd/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/businesslens/pdd/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/businesslens/pdd/releases/tag/v0.4.0
