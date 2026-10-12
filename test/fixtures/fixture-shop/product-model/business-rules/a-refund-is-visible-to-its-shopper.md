---
appliesTo:
  - type: entity
    id: refund
    effect: reads
permits:
  - related:
      - { verb: is repaid by, entity: order }
      - { verb: owns, entity: shopper }
  - actors: [store-admin]
---

# A refund is visible to its shopper

A refund is seen by the shopper whose order it repays, and by store operators.

## Rationale

Money on its way back is the shopper's to watch; nobody else's.
