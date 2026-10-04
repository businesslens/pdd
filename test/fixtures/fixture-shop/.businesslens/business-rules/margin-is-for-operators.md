---
appliesTo:
  - type: entity
    id: order
    effect: reads
    facts: [Margin]
permits:
  - actors: [store-admin]
---

# Margin is for operators

An order's Margin is shown only to store operators.

## Rationale

What the store earns on a sale is the store's business, not the shopper's.
