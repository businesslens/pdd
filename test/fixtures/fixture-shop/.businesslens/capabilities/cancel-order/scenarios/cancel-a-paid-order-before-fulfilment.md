---
kind: edge
routes:
  admin: Admin
steps:
  - text: Reconciliation shows a confirmed order cannot be fulfilled
    kind: condition
    entities:
      - { entity: order, effect: reads, facts: [] }
  - text: The store admin cancels the order before anything ships
    kind: actor
    actor: store-admin
    entities:
      - { entity: order, effect: reads, facts: [] }
    contexts:
      admin:
        place: admin-web::order-detail
  - text: The order is cancelled, its stock released, and a refund of the charge requested
    kind: product
    actor: store-admin
    entities:
      - { entity: order, effect: changes, from: Confirmed, to: Cancelled, facts: [] }
      - { entity: refund, effect: creates, to: Requested, facts: [Amount, Reason] }
    contexts:
      admin:
        place: admin-web::order-detail
---

# Cancel a paid order before fulfilment

## Trigger

A store administrator stops a paid order the store cannot fulfil.

## Outcome

The order is cancelled, its stock is released, and a refund of the charge is on
its way to the gateway so the shopper is repaid.
