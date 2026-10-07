---
kind: primary
routes:
  web: Web
steps:
  - text: The admin opens the paid order in the console
    kind: actor
    actor: store-admin
    entities:
      - { entity: order, effect: reads, facts: [Items ordered, Total charged] }
    contexts:
      web:
        place: admin-web::order-detail
  - text: The admin confirms the order
    kind: actor
    actor: store-admin
    entities:
      - { entity: order, effect: changes, from: Pending, to: Confirmed, facts: [] }
    contexts:
      web:
        place: admin-web::order-detail
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService
---

# Confirm a paid order

## Trigger

A store administrator sees a paid order waiting for manual confirmation.

## Outcome

The order is confirmed and its stock is committed.
