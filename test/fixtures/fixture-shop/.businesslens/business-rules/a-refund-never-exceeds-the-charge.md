---
appliesTo:
  - type: entity
    id: refund
    facts: [Amount]
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.refund
---

# A refund never exceeds the charge

A refund's Amount is at most the Total charged of the order it repays.

## Intent

Prevent repaying money the store never took.

## Rationale

The order is the audit boundary for the refund.
