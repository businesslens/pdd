---
kind: primary
result: achieved
routes:
  transfer: Transfer
steps:
  - text: The Developer exports the authored model as a portable Blueprint
    kind: actor
    actor: developer
    capability: export-blueprint
    contexts:
      transfer:
        place: businesslens-cli
  - text: The Product compiles it, strips the navigation that only worked in this repository, and writes the report
    kind: product
    capability: export-blueprint
    contexts:
      transfer:
        place: businesslens-cli
  - text: The Developer opens that report in the receiving repository
    kind: actor
    actor: developer
    capability: open-blueprint
    contexts:
      transfer:
        place: businesslens-cli
  - text: The Product expands it into a canonical model there, with its orientation README and a recorded need to verify alignment locally
    kind: product
    capability: open-blueprint
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
