---
kind: primary
result: achieved
routes:
  transfer: Transfer
steps:
  - text: The Developer asks for the authored model to be exported portably
    kind: actor
    actor: developer
    capability: export-blueprint
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      transfer:
        place: businesslens-cli
  - text: The Product compiles it, strips the navigation that only worked in this repository, and writes the report
    kind: product
    capability: export-blueprint
    entities:
      - { entity: product-model, effect: reads }
      - { entity: blueprint, effect: creates, to: Exported }
    contexts:
      transfer:
        place: businesslens-cli
  - text: The Developer opens that report in the receiving repository
    kind: actor
    actor: developer
    capability: open-blueprint
    entities:
      - { entity: blueprint, effect: reads }
    contexts:
      transfer:
        place: businesslens-cli
  - text: The Product expands it into a canonical model there, with its orientation README and a recorded need to verify alignment locally
    kind: product
    actor: developer
    capability: open-blueprint
    entities:
      - { entity: blueprint, effect: reads }
      - { entity: product-model, effect: creates }
    contexts:
      transfer:
        place: businesslens-cli
---

# Export here and open there

## Trigger

A Product Model has to serve a second repository — a rewrite, a split, or a
starting point for a related product.

## Outcome

The Journey goal is achieved: both repositories hold a sound model, and the
receiving one carries no reference to the file tree it came from.
