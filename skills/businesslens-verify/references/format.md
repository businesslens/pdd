# Product Model format

IDs are lowercase kebab-case filename stems; scenario IDs are globally unique.
Only `product.md` declares `id:`. H1 is title, lead prose is description or
journey summary. Relations and navigation live in frontmatter; meaning lives in
prose.

- Product: `id`, optional `tags`, `limitations`, H1, lead, optional Intent.
- Actor/Domain: H1 and lead; Domain may have `colorSlot`.
- Experience: actors, access, entry points, exit, Capability boundary.
- Feature: domain, actors, at least one experience, business-rule relations.
- Business Rule: relates to a domain, feature, journey, or scenario; optional
  Rationale.
- Journey: domain, at least one actor, experience, feature, and scenario.
- Scenario: taxonomy kind, optional business rules, Trigger, ordered Steps,
  Outcome, optional Edge cases and Decision points.
- Coverage: status, method, source areas, unmapped areas, limitations, rationale.
  `draft|partial|complete` describes model breadth only.

Optional `links` use `rel: spec|proposal|doc|adr`. Optional `codeRefs` use
`path[#symbol][:start[-end]]`, must point at tracked files, and are navigational
bookmarks—not proof, implementation state, or verification receipts. Missing
bookmarks are valid at every coverage status.

Product meaning may change only in `product.md`, taxonomies, coverage prose, and
entity prose/relationships after approval. A post-alignment bookmark refresh may
change only `codeRefs`.

`.gitignore` contains `build/` and `cache/`.

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
