---
appliesTo:
  - type: entity
    id: order
    effect: removes
permits: []
---

# Orders are never deleted

An order is cancelled or refunded, never removed.

## Rationale

The order is the audit boundary for everything the store did with a shopper's
money.
