---
kind: edge
routes:
  web: Web
  cli: CLI
steps:
  - text: The admin opens the order in the console
    kind: actor
    actor: store-admin
    entities:
      - { entity: order, effect: reads }
    contexts:
      web:
        place: admin-web::order-detail
      cli:
        place: operator-cli
  - text: The refund is issued through the order service
    kind: product
    actor: store-admin
    entities:
      - { entity: order, effect: changes, from: Confirmed, to: Refunded }
      - { entity: refund, effect: creates, to: Requested }
    contexts:
      web:
        place: admin-web::order-detail
      cli:
        place: operator-cli
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.refund
---

# Refund an order

## Trigger

A store administrator decides an eligible order should be refunded.

## Outcome

The order is refunded and a refund is on its way to the gateway.
