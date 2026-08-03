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
├── experiences/<id>.md
├── domains/<id>.md
├── features/<id>.md
├── business-rules/<id>.md
└── journeys/<journey-id>/
    ├── journey.md
    └── scenarios/<scenario-id>.md
```

IDs are lowercase kebab-case filename stems and scenario IDs are globally
unique. Only `product.md` declares `id:`. The first H1 is the title; lead prose
is the description or journey summary. Put relations and navigation in
frontmatter and meaning in prose.

## Required shapes

- `config.yaml`: `schema: 1` and `sdd.paths`.
- `product.md`: `id`, optional `tags`, `limitations`, H1, lead description, and
  optional `## Intent`.
- `taxonomies.yaml`: `scenarioKinds` entries with `id`, `name`, `description`,
  and optional `colorSlot`.
- Actor and Domain: H1 and lead description. Domain may have `colorSlot`.
- Experience: `actors`, `access` (`public|authenticated|restricted`),
  `entryPoints`, `exit`, H1, lead description, and `## Capability boundary`.
- Feature: `domain`, `actors`, at least one `experience`, `businessRules`, H1,
  and lead description.
- Business Rule: one or more relations across `domains`, `features`, `journeys`,
  or `scenarios`; H1 and lead rule statement; optional `## Rationale`.
- Journey: `domain`, at least one actor, experience, feature, and scenario;
  optional `entryPoints`; H1 and lead summary.
- Scenario: taxonomy `kind`, optional `businessRules`, H1, `## Trigger`, ordered
  `## Steps`, and `## Outcome`. Optional `## Edge cases` is a bullet list.
  Optional `## Decision points` uses H3 title, question, and at least two
  `condition → outcome` branches.
- `coverage.md`: `status`, `method`, `sourceAreas`, `unmapped`, `limitations`,
  H1, and rationale. Status is model breadth only: `draft|partial|complete`.

Optional `links` use `rel: spec|proposal|doc|adr`, `href`, and optional title.
Optional `codeRefs` use `path[#symbol][:start[-end]]`, point at tracked files,
and are navigational bookmarks—not proof or lifecycle state.

`.gitignore` contains `build/` and `cache/`.

## Verification edit boundaries

Missing bookmarks are valid at every coverage status. Product meaning may
change only in `product.md`, taxonomies, coverage prose, and entity
prose/relationships after approval. A post-alignment bookmark refresh may
change only `codeRefs`.

## Canonical `.businesslens/README.md`

When the internal scoped-map protocol creates a Product Model, write this
orientation exactly:

```markdown
# Product Model

This directory is a **BusinessLens Product Model**: what this product does and
for whom. It is plain Markdown tracked in Git, and it is the source of truth for
intended product behavior.

## If you are an agent working in this repository

- Read `product.md` first, then the actors, experiences, domains, features,
  business rules, journeys, and scenarios.
- Treat scenarios as the acceptance contract and business rules as invariants.
- Do not infer a stack or architecture from the model.
- Treat `codeRefs` as optional navigation, never proof or implementation state.
- After code changes, use `businesslens-verify`; run `npx businesslens lint`
  for structural checks.
- Use `businesslens-ideate` to change intended behavior and `businesslens-map`
  only to map established absent or deliberately untrusted behavior.
- Never edit `cache/`.

Documentation: https://businesslens.io
```
