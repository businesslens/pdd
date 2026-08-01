# BusinessLens planning format

Planned behavior lives in the same model as current behavior. The only
difference is evidence: planned journeys and scenarios carry **no**
`codeRefs` until `businesslens-verify` attaches them after implementation.

- On an existing model (coverage `partial`/`complete`), `validate` reports new
  unevidenced journeys and scenarios as errors:
  `needs at least one codeRef`. That is the expected planning end state for
  those entities — the evidence checklist. The complete plan is the model
  diff, including modified and deleted entities that may produce no
  missing-evidence finding.
- On a new product, `coverage.md` `status: draft` marks the whole model as
  planned: the same findings appear as warnings and validation stays green.
  Draft models may be exported or proposed as catalog Blueprints.

## Entity shapes

- IDs are lowercase kebab-case filename stems; a journey ID is its directory
  name. Never write `id:` in entity frontmatter (only `product.md` has one).
- Actors: `actors/<id>.md` — no required frontmatter; H1 name + lead.
- Domains: `domains/<id>.md` — optional `colorSlot`; H1 name + lead.
- Experiences: `experiences/<id>.md` — `actors`, `access`
  (`public|authenticated|restricted`), `entryPoints` (compact `type: path`
  items), `exit`, H1 + lead, and a `## Capability boundary` section.
- Features: `features/<id>.md` — `domain`, `actors`, `experiences`,
  `businessRules`; H1 + lead and optional `## Intent`.
- Business rules: `business-rules/<id>.md` — relation lists for `domains`,
  `features`, `journeys`, and `scenarios`; H1 + statement lead, optional
  `## Intent` and `## Rationale`.
- Journeys: `journeys/<id>/journey.md` — `domain`, `actors`, `experiences`,
  `features`, optional `entryPoints`; H1 + lead summary; needs at least one
  scenario.
- Scenarios: `journeys/<jid>/scenarios/<id>.md` — taxonomy `kind`, optional
  `businessRules`, H1,
  `## Trigger` (paragraph), `## Steps` (ordered list, ≥1), `## Outcome`
  (paragraph), optional `## Decision points` and `## Edge cases` (bullets).
  Scenario IDs are globally unique across the whole model.
- `codeRefs` grammar is `path[#symbol][:start[-end]]`; every path present
  must be Git-tracked. During planning, omit them entirely for new behavior
  and keep only still-valid ones on modified entities.
- Optional `links:` (`rel: spec|proposal|doc|adr`) connect entities to SDD
  specs and design docs; link technical designs instead of describing them.

## Greenfield scaffold (new product)

- `config.yaml`: `schema: 1` and `sdd:\n  paths: []`. No legacy `platform` block.
- `taxonomies.yaml`: at least `primary` and `edge` scenario kinds.
- `product.md`: lowercase kebab-case `id` of at most 64 characters, `tags`,
  `limitations`, H1 name, lead description.
- `coverage.md`: `status: draft`, method noting the model was planned before
  implementation, empty `sourceAreas`.
- `.gitignore`: `build/` and `cache/`.
