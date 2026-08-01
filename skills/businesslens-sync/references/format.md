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

## Deriving a plan's delta

Applies only when a plan exists on the branch.

- Planned behavior is simply model entities without evidence: journeys and
  scenarios lacking `codeRefs`. On a model with coverage `partial`/`complete`
  they validate as errors; on a `status: draft` model (planned greenfield
  product) they validate as warnings.
- The planned delta is derived, never stored: every added, modified, or
  deleted authored file in `git diff <base>...HEAD -- .businesslens/`, plus
  uncommitted edits, unioned with every evidence-less journey and scenario.
  Retain the base content of deletions so removal can be verified. Re-derive
  the delta on every run.
- `codeRefs` use `path[#symbol][:start[-end]]`; every path must be tracked
  by Git; prefer symbols over line numbers. Attach them to the scenario that
  claims the behavior and to its journey. Ask the user to stage or commit any
  new implementation file needed as evidence; never stage it yourself.
- Scenario sections are the acceptance contract: `## Trigger` (paragraph),
  `## Steps` (ordered list), `## Outcome` (paragraph), optional
  `## Edge cases` (bullets), and optional `## Decision points` whose H3
  decisions each contain a question and at least two condition/outcome
  branches.
- Features and Business Rules are first-class work items. Verify changed
  capability boundaries, constraints, and their entity relationships rather
  than treating them as incidental prose.
- `coverage.md` `status: draft` → `partial`/`complete` only when every
  planned journey and scenario is evidenced, every implementation-bearing
  addition/change/removal is met, and every product-only item is explicitly
  classified as model-only; refresh `method`, `sourceAreas`, `unmapped`, and
  `limitations` at the same time. Draft models may be exported or proposed as
  catalog Blueprints, but remain
  explicitly planned rather than evidence-backed.
- Verification writes only model files (`codeRefs`, confirmed prose
  corrections, coverage). The met/gap report lives in the conversation.
