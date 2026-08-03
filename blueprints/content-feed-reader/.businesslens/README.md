# Product Model

This directory is a **BusinessLens Product Model**: what this product does and
for whom. It is plain Markdown tracked in Git, and it is the source of truth for
intended product behavior.

## If you are an agent working in this repository

- Read `product.md` first, then the actors, experiences, optional screens,
  domains, features, business rules, journeys, and scenarios.
- Treat scenarios as the acceptance contract and business rules as invariants.
- Do not infer a stack or architecture from the model.
- Treat `codeRefs` as optional navigation, never proof or implementation state.
- After code changes, use `businesslens-verify`; run `npx businesslens lint`
  for structural checks.
- Use `businesslens-ideate` to change intended behavior and `businesslens-map`
  only to map established absent or deliberately untrusted behavior.
- Never edit `cache/`.

Documentation: https://businesslens.io
