---
appliesTo:
  - type: entity
    id: order
    facts: [Total charged]
---

# Total charged

Total charged always equals Subtotal plus Tax minus Discount.

## Rationale

The receipt, the refund limit and the margin all read one number, so it is
derived in one place.
