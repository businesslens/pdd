---
kind: edge
routes:
  local: Local
steps:
  - text: The Developer opens an Entity's page and its Lifecycle tab
    kind: actor
    actor: developer
    entities:
      - { entity: entity, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-page
  - text: The Product draws its states as one machine composed from every Step that creates, moves, or removes it, labels each arc with the Capability whose Step draws it, and marks the arcs a Business Rule restricts or forbids
    kind: product
    entities:
      - { entity: entity, effect: reads }
      - { entity: capability, effect: reads }
      - { entity: business-rule, effect: reads }
    contexts:
      local:
        place: local-report-web::resource-page
  - text: The Developer reads who may move it on the arc, and follows it to the Rule's own page for the full grant
    kind: actor
    actor: developer
    entities: []
    contexts:
      local:
        place: local-report-web::resource-page
---

# Read a thing's lifecycle and who may move it

## Trigger

The Developer wants to know how a thing the product keeps moves through its
states, and who is allowed to move it.

## Outcome

The Developer has read a lifecycle nobody authored as one: every arc is a Step
somewhere, every label a Capability, and every restriction a Rule they can open.

## Edge cases

- A state no Step leaves anything in is drawn hollow and marked unreached rather than dropped, so the gap is visible.
- A thing no Step creates is noted as pre-existing the model, which is a fact about the model and not a finding against it.
- An arc a Rule forbids to everyone is drawn crossed out, with the Rule's name on it, and never as a path.
