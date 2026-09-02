---
appliesTo:
  - type: entity
    id: order
    effect: changes
    to: Refunded
permits:
  - actors: [store-admin]
    when: [{ fact: Total charged, at-most: 100 }]
  - configuredBy: store-settings
    when: [{ fact: Total charged, over: { configuredBy: store-settings } }]
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.refund
---

# Refunds need an operator

A refund of up to 100 is an operator's call. Above the threshold the store
configures, only whoever the store has configured as its approver may issue one.

## Rationale

Small refunds must be quick; large ones must be somebody's decision.
