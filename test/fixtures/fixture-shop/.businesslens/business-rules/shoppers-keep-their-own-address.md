---
appliesTo:
  - type: entity
    id: shopper
    effect: changes
    facts: [Delivery address]
permits:
  - self: true
---

# Shoppers keep their own address

Only a shopper changes their own delivery address.

## Rationale

Where a person's parcels go is theirs to decide, and not an operator's to edit.
