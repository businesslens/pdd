---
appliesTo:
  - type: entity
    id: order
    effect: changes
permits:
  - related: [{ verb: owns, entity: shopper }]
    when: [{ state: Pending }]
  - actors: [store-admin]
  - actors: [payment-gateway]
    when: [{ state: Pending }]
  - unattended: true
    when: [{ state: Pending }]
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService
---

# Who may change an order

A store operator changes an order freely. Its shopper, the payment gateway, and
the Product's own schedule change it only while it is still unpaid.

## Rationale

Once money has settled, every change to an order is a promise to a customer,
and only a person accountable to the store makes those.
