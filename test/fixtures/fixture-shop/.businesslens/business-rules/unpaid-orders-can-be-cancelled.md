---
appliesTo:
  - type: entity
    id: order
    effect: changes
    from: Pending
    to: Cancelled
permits:
  - related: [{ verb: owns, entity: shopper }]
    when: [{ entity: store-settings, fact: Self-service cancellation, is: true }]
  - actors: [store-admin]
  - unattended: true
---

# Unpaid orders can be cancelled

An unpaid order is cancelled by its shopper when the store allows self-service
cancellation, by an operator, or by the Product when the payment window closes.

## Rationale

Nothing has been charged yet, so cancellation costs nobody anything.
