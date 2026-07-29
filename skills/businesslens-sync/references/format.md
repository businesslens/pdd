# BusinessLens synchronization format

- Entity IDs are lowercase kebab-case filename stems; a journey ID is its
  directory name. Only `product.md` declares `id:`.
- Actors live at `actors/<id>.md`.
- Experiences live at `experiences/<id>.md` and require `actors`, `access`,
  `entryPoints`, `exit`, lead prose, and `## Capability boundary`.
- Domains live at `domains/<id>.md`.
- Features live at `features/<id>.md` and require `domain`, at least one
  `experience`, and relation lists for actors and business rules.
- Business rules live at `business-rules/<id>.md` and relate to one or more
  domains, features, journeys, or scenarios.
- Journeys live at `journeys/<id>/journey.md` and require `domain`, `actors`,
  `experiences`, `features`, `entryPoints`, `codeRefs`, H1, and lead prose.
- Scenarios live at `journeys/<journey-id>/scenarios/<id>.md` and require a
  taxonomy `kind`, optional `businessRules`, direct `codeRefs`, and
  Trigger/Steps/Outcome sections. Optional Decision points contain a question
  and at least two `condition → outcome` branches.
- Scenario IDs are globally unique.
- Compact evidence uses `path[#symbol][:start[-end]]` and every path must be
  tracked by Git.
- Optional `links:` use `rel: spec|proposal|doc|adr` and a repository-relative
  or HTTP `href`.
- `## Intent` is structured prose on the product or an entity, not a separate
  entity.
- `coverage.md` records `status`, `method`, `sourceAreas`, `unmapped`, and
  `limitations`.
