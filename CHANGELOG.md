# Changelog

Each release lists what changed for the people who use BusinessLens. This
project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.12.0] - 2026-09-10

- Every page of the report reads the same way: what it is and the ways out of
  it, then tabs for which set you are reading, then what narrows it.
- Tabs are the report's only switch. Each named reading sits beside List in the
  collection it belongs to; the Cards/Table toggle and the grouping menu are gone.
- Filters sit beside the rows they narrow, one control per axis, on every
  collection whatever its size.
- Collections group by Domain on their own, and Entities that act lead the list.
- Overview is the Product's own page, with About, Coverage and References.
- Compare delivery is now a Capability by Interface matrix.
- The All resources and connections view is removed; the rail already lists
  every collection and a resource's connections are on its page.
- The documentation explains the Product Model. The report explains itself.
- Fixed missing icons and the cursor on interactive controls.
- Report links shared before this release open the Overview.

## [0.11.0] - 2026-09-07

- Generated product models omit rejected approaches and settled deliberation.

## [0.10.0] - 2026-09-06

- Inline term definitions and a searchable Vocabulary panel, with an option to
  hide the tooltips that explain terms.

## [0.9.0] - 2026-09-04

- Entity is one resource type for everything the Product keeps or reasons about,
  with named facts, optional states, and relations that state both ends.
- Business Rules can express who is permitted to do what, and `lint` rejects
  behavior no grant can permit.
- Scenario Steps say what they create, change, remove or read. Lifecycles are
  composed from them instead of authored twice.
- Actor is no longer a resource type: a person or system that acts is an Entity.
- The report renders every Entity reading, including a composed lifecycle.
- BusinessLens keeps a reviewed Product Model of itself.

## [0.8.0] - 2026-08-25

- Every resource has its own page, at its own URL, with a breadcrumb and a
  working back button.
- The Product Report ships as a shared Nuxt renderer with interactive maps of
  Interfaces, Domains, Journeys and Screens.
- Context is the single way to say where something happens, and both kinds of
  Scenario share one routes-and-Steps model.
- Every Interface declares its interaction type: web, mobile, CLI, API and more.
- A resource expands into its own folder when it owns assets or children, and
  files beside it are treated as product assets.
- Domains state what their Boundary excludes.

## [0.7.2] - 2026-08-05

- The Blueprint catalog publisher is discoverable before a credential is
  configured, and its credential reaches only the production catalog.
- Tab icons show both letters at small sizes.

## [0.7.1] - 2026-08-04

- Plain Node consumers can import `businesslens/theme-lab/variants`.

## [0.7.0] - 2026-08-04

- `businesslens view` renders the current Product Model privately on localhost
  and refreshes as you edit it.
- Interfaces, Screens and References become first-class parts of the model.
- The skill set is `businesslens-map`, `businesslens-ideate` and
  `businesslens-verify`.
- `validate` is now `lint`, and it checks structure, never semantics.
- Breaking: Feature is renamed Capability, and only the current folder and
  report formats are accepted.

## [0.6.0] - 2026-07-31

- The Blueprint catalog moves to businesslens.io and is anonymous to browse and
  to pull.
- `businesslens open` expands a report back into a Product Model, and `pull`
  retrieves a Blueprint from the catalog.
- Features and business rules become first-class model resources.
- `publish` is now `contribute` and opens a pull request instead of submitting
  to a platform.
- `build` is now `export` and emits a report carrying no repository evidence.

## [0.5.0] - 2026-07-26

- `build` and `publish` commands, with a recipe for running them on CI.

## [0.4.0] - 2026-07-26

- Initial public release: the CLI, the agent skills, and the `.businesslens/`
  format.

[0.12.0]: https://github.com/businesslens/pdd/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/businesslens/pdd/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/businesslens/pdd/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/businesslens/pdd/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/businesslens/pdd/compare/v0.7.2...v0.8.0
[0.7.2]: https://github.com/businesslens/pdd/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/businesslens/pdd/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/businesslens/pdd/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/businesslens/pdd/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/businesslens/pdd/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/businesslens/pdd/releases/tag/v0.4.0
