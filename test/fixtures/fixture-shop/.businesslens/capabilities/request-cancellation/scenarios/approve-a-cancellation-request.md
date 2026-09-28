---
kind: primary
routes:
  web: Web
steps:
  - text: The shopper asks to cancel an order that has not been paid
    kind: actor
    actor: shopper
    entities:
      - { entity: order, effect: reads, facts: [Items ordered, Total charged] }
    contexts:
      web:
        place: customer-web::storefront::order-status
  - text: A store operator approves the request and the order is cancelled
    kind: actor
    actor: store-admin
    entities:
      - { entity: order, effect: changes, from: Pending, to: Cancelled, facts: [] }
    contexts:
      web:
        place: admin-web::order-detail
---

# Approve a cancellation request

## Trigger

A shopper asks to cancel an unpaid order in a store that approves cancellations.

## Outcome

The order is cancelled once an operator approves, and nothing is charged.
