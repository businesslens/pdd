---
kind: edge
routes:
  terminal: Terminal
steps:
  - text: The target directory already holds a Product Model
    kind: condition
    entities:
      - { entity: product-model, effect: reads, as: previous }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Developer asks for the Blueprint to be opened there anyway, accepting the replacement
    kind: actor
    actor: developer
    entities:
      - { entity: blueprint, effect: reads }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product moves the existing model to a timestamped sibling copy, keeps it, and reports where it went
    kind: product
    actor: developer
    entities:
      - { entity: product-model, effect: removes, as: previous }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product puts the expanded Blueprint in its place
    kind: product
    actor: developer
    entities:
      - { entity: blueprint, effect: reads }
      - { entity: product-model, effect: creates, as: incoming }
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
