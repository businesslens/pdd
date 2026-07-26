# BusinessLens synchronization format

- Entity IDs are lowercase kebab-case filename stems; a journey ID is its
  directory name. Only `product.md` declares `id:`.
- Actors live at `actors/<id>.md`.
- Experiences live at `experiences/<id>.md` and require `actors`, `access`,
  `entryPoints`, `exit`, lead prose, and `## Capability boundary`.
- Domains live at `domains/<id>.md`.
- Journeys live at `journeys/<id>/journey.md` and require `domain`, `actors`,
  `experiences`, `entryPoints`, `codeRefs`, H1, and lead prose.
- Scenarios live at `journeys/<journey-id>/scenarios/<id>.md` and require a
  taxonomy `kind`, direct `codeRefs`, and Trigger/Steps/Outcome sections.
- Scenario IDs are globally unique.
- Compact evidence uses `path[#symbol][:start[-end]]` and every path must be
  tracked by Git.
- Optional `links:` use `rel: spec|proposal|doc|adr` and a repository-relative
  or HTTP `href`.
- `coverage.md` records `status`, `method`, `sourceAreas`, `unmapped`, and
  `limitations`.
