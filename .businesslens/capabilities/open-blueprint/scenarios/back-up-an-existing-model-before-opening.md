---
kind: edge
routes:
  terminal: Terminal
steps:
  - text: The target directory already holds a Product Model
    kind: condition
    reads:
      - product-model
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Developer asks for the Blueprint to be opened there anyway, accepting the replacement
    kind: actor
    actor: developer
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product moves the existing model to a timestamped sibling copy, keeps it, and reports where it went
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product puts the expanded Blueprint in its place
    kind: product
    changes:
      - entity: product-model
      - entity: product
      - entity: actor
      - entity: interface
      - entity: experience
      - entity: screen
      - entity: domain
      - entity: entity
      - entity: capability
      - entity: capability-scenario
      - entity: journey
      - entity: journey-scenario
      - entity: business-rule
    contexts:
      terminal:
        place: businesslens-cli
---

# Back up an existing model before opening

## Trigger

The Developer deliberately wants the incoming Blueprint to replace the model
already in the target.

## Outcome

The new model is in place and the previous one still exists beside it under a
timestamped name that is never deleted.
