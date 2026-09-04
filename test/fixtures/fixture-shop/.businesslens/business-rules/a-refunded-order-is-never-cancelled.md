---
appliesTo:
  - type: entity
    id: order
    effect: changes
    from: Refunded
    to: Cancelled
permits: []
---

# A refunded order is never cancelled

Once an order has been refunded it is final; nobody moves it anywhere else.

## Rationale

The money has already gone back. A second lifecycle move would make the books
disagree with the bank.
