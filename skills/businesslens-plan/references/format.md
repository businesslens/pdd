# BusinessLens planning format

Planned behavior lives in the same map as current behavior. The only
difference is evidence: planned journeys and scenarios carry **no**
`codeRefs` until `businesslens-verify` attaches them after implementation.

- On an existing map (coverage `partial`/`complete`), `validate` reports new
  unevidenced journeys and scenarios as errors:
  `needs at least one codeRef`. That is the expected planning end state for
  those entities — the evidence checklist. The complete plan is the map
  diff, including modified and deleted entities that may produce no
  missing-evidence finding.
- On a new product, `coverage.md` `status: draft` marks the whole map as
  planned: the same findings appear as warnings and validation stays green.
  `build`/`publish` refuse draft maps.

## Entity shapes

- IDs are lowercase kebab-case filename stems; a journey ID is its directory
  name. Never write `id:` in entity frontmatter (only `product.md` has one).
- Actors: `actors/<id>.md` — no required frontmatter; H1 name + lead.
- Domains: `domains/<id>.md` — optional `colorSlot`; H1 name + lead.
- Experiences: `experiences/<id>.md` — `actors`, `access`
  (`public|authenticated|restricted`), `entryPoints` (compact `type: path`
  items), `exit`, H1 + lead, and a `## Capability boundary` section.
- Journeys: `journeys/<id>/journey.md` — `domain`, `actors`, `experiences`,
  optional `entryPoints`; H1 + lead summary; needs at least one scenario.
- Scenarios: `journeys/<jid>/scenarios/<id>.md` — taxonomy `kind`, H1,
  `## Trigger` (paragraph), `## Steps` (ordered list, ≥1), `## Outcome`
  (paragraph), optional `## Edge cases` (bullets). Scenario IDs are globally
  unique across the whole map.
- `codeRefs` grammar is `path[#symbol][:start[-end]]`; every path present
  must be Git-tracked. During planning, omit them entirely for new behavior
  and keep only still-valid ones on modified entities.
- Optional `links:` (`rel: spec|proposal|doc|adr`) connect entities to SDD
  specs and design docs; link technical designs instead of describing them.

## Greenfield scaffold (new product)

- `config.yaml`: `schema: 1` and `sdd:\n  paths: []`. No platform block.
- `taxonomies.yaml`: at least `primary` and `edge` scenario kinds.
- `product.md`: `id`, `tags`, `limitations`, H1 name, lead description.
- `coverage.md`: `status: draft`, method noting the map was planned before
  implementation, empty `sourceAreas`.
- `.gitignore`: `build/` and `cache/`.

## Managed `AGENTS.md` block

Insert (or leave intact) exactly one such block in the repository root
`AGENTS.md`, preserving everything outside the markers:

```markdown
<!-- businesslens:begin -->
## BusinessLens product map

This repository maintains its product truth in `.businesslens/` (Product-Driven Development).

- **Before** building or changing behavior: read the relevant experience/journey/scenario files to understand current behavior and where it lives (`codeRefs`).
- **Plan** product changes by updating the map first (`businesslens-plan`), implement, then attach evidence with `businesslens-verify`.
- **After** unplanned behavior changes: update the affected entity files and run `npx businesslens validate`.
- Never edit `.businesslens/cache/` — generated.
<!-- businesslens:end -->
```
