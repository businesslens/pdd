# Product Model format

## Layout

```text
.businesslens/
├── README.md
├── config.yaml
├── product.md
├── taxonomies.yaml
├── coverage.md
├── .gitignore
├── actors/<id>.md
├── interfaces/<id>.md
├── experiences/<id>.md          # optional collection
├── screens/<id>.md              # optional collection
├── domains/<id>.md              # optional collection
├── capabilities/<id>.md
├── capability-scenarios/<id>.md
├── journeys/<id>.md             # optional collection
├── journey-scenarios/<id>.md    # required when Journeys exist
└── business-rules/<id>.md
```

IDs are lowercase kebab-case filename stems. Capability Scenario and Journey
Scenario IDs share one global namespace. Only `product.md` declares `id:`. The
first H1 is the title. Most entities use lead prose as their description;
Journeys and both Scenario types instead use required named sections. Put
relations and navigation in frontmatter and Product meaning in prose.

## Required shapes

- `config.yaml`: exactly `schema: 4` and `sdd.paths`.
- `product.md`: `id`, optional `tags`, `limitations`, H1, lead description, and
  optional `## Intent`.
- `taxonomies.yaml`: `scenarioKinds` entries with `id`, `name`, `description`,
  and optional `colorSlot`.
- Actor: required `kind: person|system` and `relationship: external|internal`,
  H1, and lead description.
- Interface: at least one `actors` relation; optional Product-facing
  `entryPoints`; H1, lead description, and `## Capability boundary`.
- Experience: at least one `actors` and `interfaces`; `access`
  (`public|authenticated|restricted`); optional Interface-keyed `entryPoints`;
  H1, lead description, and `## Capability boundary`. The collection is
  optional.
- Capability: at least one exact `availability` scope; optional singular
  `domain`; H1 and lead description. Every Capability needs a Capability
  Scenario: absence is an error at complete coverage and a warning at draft or
  partial coverage.
- Capability Scenario: taxonomy `kind`, one `capability`, at least one `actor`,
  and non-empty exact `availability` supported by that Capability.
- Domain: H1 and lead description; optional `colorSlot`. The collection is
  optional and only organizes Capabilities.
- Screen: at least one exact `availability` scope and `capabilities` relation;
  optional `capabilityScenarios`, `journeyScenarios`, and Interface-keyed Product
  entry points; H1, lead, bullet `## Information presented`, optional bullet
  `## Available actions`, optional H3 `## Product states`, and
  `## Capability boundary`. The whole collection is optional.
- Business Rule: one or more relations across `domains`, `capabilities`,
  `journeys`, `capabilityScenarios`, `journeyScenarios`, or `availability`; H1
  and lead assertion; optional `## Rationale`.
- Journey: at least one `actor`, H1, `## Goal`, and `## Success criterion`. A
  Journey is a stable goal, not a route or Capability wrapper. Every Journey
  needs at least one achieved Journey Scenario. It has no `entryPoints`; resolve
  presentation routes from the first flow item of achieved Scenarios and the
  matching Interface or Experience.
- Journey Scenario: taxonomy `kind`, one `journey`, at least one `actor`,
  `result: achieved|not-achieved`, and an ordered non-empty `flow`. Every flow
  item needs `capability`, a one-line `operation`, and non-empty exact
  `availability` supported by that Capability. An achieved Scenario traverses
  at least two distinct Capabilities.
- `coverage.md`: `status`, `method`, `sourceAreas`, `unmapped`, `limitations`,
  H1, and rationale. Status is model breadth only: `draft|partial|complete`.

Both Scenario types have no lead prose and require `## Trigger`, ordered
`## Steps`, and `## Outcome`. Optional `## Edge cases` is a bullet list.
Optional `## Decision points` uses an H3 title, a question, and at least two
`condition → outcome` branches that converge on the Scenario's one result. A
branch that changes the Capability sequence or terminal result is a separate
Scenario. `kind` describes the nature of the variation; `result` describes the
terminal Journey goal outcome, so the fields are orthogonal.

Exact availability uses this shared shape:

```yaml
availability:
  - interface: reader-web
    experiences: [personal-workspace, account-management]
  - interface: reader-mobile
    experiences: [personal-workspace]
  - interface: operator-cli
```

Each Interface appears at most once. If any Experience declares an Interface,
every availability record for it needs a non-empty, unique Experience list and
every named Experience must declare that Interface. If no Experience declares
an Interface, omit `experiences`; an explicit empty list is invalid.
Availability is intended Product scope, not implementation status.

For each Scenario, every exact context must support at least one of its Actors,
and every named Actor must be supported in at least one exact context. A
Capability Scenario's availability is a subset of its Capability. Each Journey
flow item is checked independently against its Capability. A Screen's
Capability Scenario must target one of the Screen's Capabilities and intersect
the Screen's exact contexts. A Screen's Journey Scenario must have at least one
flow item whose Capability the Screen names in an intersecting exact context.

Every semantic entity may contain optional `references`. Each strict item needs
`kind: code|spec|proposal|doc|adr|visual|research`,
`role: intent|implementation|context`, `target`, and optional `title`. Code
targets use `path[#symbol][:start[-end]]` and their path must be tracked. Other
targets use HTTP(S) or a repository-relative path. Duplicate targets on one
entity are invalid. References are attachments, never proof or lifecycle state.
Coverage, config, and taxonomies do not accept them.

`.gitignore` contains `build/` and `cache/`.

## Canonical `.businesslens/README.md`

Write this orientation for every new Product Model:

```markdown
# Product Model

This directory is a **BusinessLens Product Model**: what this product does and
for whom. It is plain Markdown tracked in Git, and it is the source of truth for
intended product behavior.

## If you are an agent working in this repository

- Read `product.md` first, then Actors and Interfaces, optional Experiences,
  Screens, and Domains, followed by Capabilities, Business Rules, Journeys, and
  both Scenario collections.
- Treat Capability Scenarios as local acceptance contracts, Journey Scenarios
  as end-to-end flow contracts, and Business Rules as invariants.
- Do not infer a stack or architecture from the model.
- References are optional navigation and context. Their role explains why an
  artifact is attached; it never proves alignment or replaces product prose.
- After code changes, use `businesslens-verify`; run `npx businesslens lint`
  for structural checks.
- Use `businesslens-ideate` to change intended behavior and `businesslens-map`
  only to map established absent or deliberately untrusted behavior.
- Never edit `cache/`.

Documentation: https://businesslens.io
```
