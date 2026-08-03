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
├── experiences/<id>.md
├── screens/<id>.md              # optional collection
├── domains/<id>.md              # optional collection
├── capabilities/<id>.md
├── business-rules/<id>.md
└── journeys/<journey-id>/
    ├── journey.md
    └── scenarios/<scenario-id>.md
```

IDs are lowercase kebab-case filename stems and Scenario IDs are globally
unique. Only `product.md` declares `id:`. The first H1 is the title. Lead prose
is the entity description or Journey summary; Scenarios instead begin with the
required `## Trigger` section and have no lead. Put relations and navigation in
frontmatter and Product meaning in prose.

## Required shapes

- `config.yaml`: exactly `schema: 3` and `sdd.paths`. Older schemas are not
  accepted.
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
  H1, lead description, and `## Capability boundary`.
- Capability: at least one exact `availability` pair; optional singular
  `domain`; H1 and lead description.
- Domain: H1 and lead description; optional `colorSlot`. The collection is
  optional and only organizes Capabilities.
- Screen: at least one exact `availability` pair and `capabilities` relation;
  optional `scenarios` and Interface-keyed Product entry points; H1, lead,
  bullet `## Information presented`, optional bullet `## Available actions`,
  optional H3 `## Product states`, and `## Capability boundary`. The whole
  collection is optional.
- Business Rule: one or more relations across `domains`, `capabilities`,
  `journeys`, `scenarios`, or `availability`; H1 and lead assertion; optional
  `## Rationale`.
- Journey: at least one Actor, Capability, availability pair, and Scenario;
  optional Interface-keyed `entryPoints`; H1 and lead summary. Journey has no
  singular Domain.
- Scenario: taxonomy `kind`, optional availability subset of its Journey, H1,
  `## Trigger`, ordered `## Steps`, and `## Outcome`. Optional `## Edge cases`
  is a bullet list. Optional `## Decision points` uses H3 title, question, and
  at least two `condition → outcome` branches that converge on the Scenario's
  one observable outcome; materially different outcomes are separate Scenarios.
- `coverage.md`: `status`, `method`, `sourceAreas`, `unmapped`, `limitations`,
  H1, and rationale. Status is model breadth only: `draft|partial|complete`.

Exact availability uses this shared shape:

```yaml
availability:
  - interface: reader-web
    experiences: [personal-workspace, account-management]
  - interface: reader-mobile
    experiences: [personal-workspace]
```

Each Interface appears at most once and each Experience list is non-empty and
unique. Every Experience must declare that Interface. Journey and Screen pairs
must be supported by every Capability they reference. Scenario availability,
when present, must be a subset of its Journey. Availability is intended Product
scope, not implementation status.

Every semantic entity may contain optional `references`. Each strict item needs
`kind: code|spec|proposal|doc|adr|visual|research`,
`role: intent|implementation|context`, `target`, and optional `title`. Code
targets use `path[#symbol][:start[-end]]` and their path must be tracked. Other
targets use HTTP(S) or a repository-relative path. Duplicate targets on one
entity are invalid. References are attachments, never proof or lifecycle state.
Coverage, config, and taxonomies do not accept them.

`.gitignore` contains `build/` and `cache/`.

## Verification edit boundaries

Missing References are valid at every Coverage status. Product meaning may
change only in `product.md`, taxonomies, coverage prose, and entity
prose/relationships after approval. A post-alignment navigation refresh may
change only implementation References.

## Canonical `.businesslens/README.md`

When the internal scoped-map protocol creates a Product Model, write this
orientation exactly:

```markdown
# Product Model

This directory is a **BusinessLens Product Model**: what this product does and
for whom. It is plain Markdown tracked in Git, and it is the source of truth for
intended product behavior.

## If you are an agent working in this repository

- Read `product.md` first, then Actors, Interfaces, Experiences, optional
  Screens and Domains, Capabilities, Business Rules, Journeys, and Scenarios.
- Treat scenarios as the acceptance contract and business rules as invariants.
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
