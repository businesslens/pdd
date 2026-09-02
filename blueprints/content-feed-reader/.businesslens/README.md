# Product Model

This directory is a **BusinessLens Product Model**: what this product does and
for whom. It is plain Markdown tracked in Git, and it is the source of truth for
intended product behavior.

## If you are an agent working in this repository

- Read `product.md` or `product/product.md` first, then the Entities — the
  things the product keeps, including the people and systems that act on it —
  and the Interfaces, optional Experiences, Screens, and Domains, followed by
  Capabilities, Business Rules, Journeys, and both Scenario collections.
- Expect leaf resources as `<id>.md`; `<id>/<type>.md` means that resource owns
  child resources or assets.
- Treat Capability Scenarios as local acceptance contracts, Journey Scenarios
  as end-to-end Steps contracts, and Business Rules as what must remain true,
  including who may act.
- Do not infer a stack or architecture from the model.
- References are optional navigation and context. Their role explains why an
  artifact is attached; it never proves alignment or replaces product prose.
- After code changes, use `businesslens-verify`; run `npx businesslens lint`
  for structural checks.
- Use `businesslens-ideate` to change intended behavior and `businesslens-map`
  only to map established absent or deliberately untrusted behavior.
- Never edit `cache/`.

Documentation: https://businesslens.io
