---
domain: model-authoring
relations:
  - entity: interface
    verb: offers
    cardinality: one-to-many
  - entity: experience
    verb: offers
    cardinality: one-to-many
  - entity: screen
    verb: offers
    cardinality: one-to-many
  - entity: entity
    verb: offers
    cardinality: one-to-many
  - entity: capability
    verb: offers
    cardinality: one-to-many
  - entity: journey
    verb: offers
    cardinality: one-to-many
  - entity: business-rule
    verb: offers
    cardinality: one-to-many
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: The .businesslens/ folder contract
  - kind: doc
    role: context
    target: docs/variations.md
  - kind: code
    role: implementation
    target: src/core/portable.ts#ReportVariationSchema
---

# Variation

One product choice with several supported answers: Standard or Strict refund
review, five product page layouts under an experiment, two live versions of a
webhook contract. Naming the choice once, as its own resource, is what keeps its
alternatives from reading as unrelated duplicates or contradictory policies. It
is read as the type it varies, and it moves nothing: each alternative keeps its
own folder, owner and Domain.

## Information kept

- **Choice** — the named product choice and why its alternatives coexist
- **Subtype** — Experiment, Configuration or Version: why the alternatives coexist
- **Member type** — the one resource type every alternative has
- **Alternatives** — the resources that answer the choice, each with the condition that selects it and, for a Version, its label
- **Selection** — what chooses between the alternatives: the settings, the assignment unit and method, or the version discriminator, as Entity and fact references where modeled
- **Takes effect** — when the choice is made or re-evaluated
- **Stability** — how long the choice holds, and what happens to existing work when it changes
