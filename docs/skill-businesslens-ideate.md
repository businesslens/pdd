---
title: ideate
description: Explore or define intended behavior, then write only the exact Product Model change you approve.
section: open-source
group: Skills
order: 18
---

# `businesslens-ideate`

**Ideate decides what the product should do and writes that decision into the
Product Model.**

Use it for a new product or for any change in behavior, before you implement. If
the repository already has code but no model, it stops and asks you to run
[`businesslens-map`](./skill-businesslens-map.md) first: it won't plan against
behavior nobody has described.

```text
/businesslens-ideate guest checkout
```

## What you get

1. **Questions, each with a recommendation.** A small, specific change gets at
   most three, asked together. A new product or a broad change is worked in
   rounds, waiting after each: **boundary** first (what the product is, who it
   is for, which surfaces are supported [Interfaces](./interfaces.md)), then
   **granularity**, such as whether a family of things is one
   [Entity](./entities.md) or several, quoted with both counts; then
   **coverage**, which cases each [Capability](./capabilities.md) needs; then
   **naming**, the product's own word for each thing.
2. **The proposed change.** Every resource added, changed or removed, each
   Capability's Scenarios, the implementation work it implies, and any open
   questions.
3. **Files written after you approve**, only inside `.businesslens/`.
4. **Lint**, fixed until clean.
5. **The acceptance contract for your implementation**: the approved change
   and its Scenarios, which your implementation must satisfy and
   [`businesslens-verify`](./skill-businesslens-verify.md) will check.

Ideate never writes code. Implementation happens in your own workflow;
BusinessLens has no implement skill.

## Modes

- **Explore**: no specific change yet. It proposes three to five genuinely
  different directions and writes nothing.
- **Converge**: a named outcome or behavior. It works the questions above,
  then writes the approved change.
- **Resolve**: verify has already found a gap and you decided the model should
  change. It skips brainstorming and drafts the smallest exact change.

## What it decides

Beyond what the product does and where, ideate settles:

- **Who may** do each thing, always as a grant on a
  [Business Rule](./business-rules.md), never a sentence in a Scenario.
- **Flags, plans and A/B tests**: whether each makes a
  [Variation](./variations.md), by
  [What selects](./variations.md#what-selects-decides-it).
- **Granularity**: Scenarios are cases of one behavior. Something meaningful
  on its own becomes its own Capability, grouped by a
  [Domain](./domains.md) when that helps.

It attaches the PRD, spec or design the decision came from as a
[Reference](./references.md) with `role: intent`, so the source stays linked
without being copied. See
[Is this replacing my PRD?](./product-model.md#is-this-replacing-my-prd)

## Related

- [Development loop](./index.md#the-development-loop): ideate, implement, verify.
- [Start from an idea](./from-an-idea.md)
