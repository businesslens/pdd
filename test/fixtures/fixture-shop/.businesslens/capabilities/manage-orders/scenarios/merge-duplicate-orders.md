---
kind: edge
routes:
  web: Web
  cli: CLI
steps:
  - text: The admin merges a duplicate order into the original
    kind: actor
    actor: store-admin
    entities:
      - { entity: order, as: duplicate, effect: reads }
      - { entity: order, as: original, effect: reads }
    contexts:
      web:
        place: admin-web::order-detail
      cli:
        place: operator-cli
  - text: The duplicate is cancelled and its items are added to the original
    kind: product
    actor: store-admin
    entities:
      - { entity: order, as: duplicate, effect: changes, from: Pending, to: Cancelled }
      - { entity: order, as: original, effect: changes }
    contexts:
      web:
        place: admin-web::order-detail
      cli:
        place: operator-cli
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService
---

# Merge duplicate orders

## Trigger

A shopper has placed the same unpaid order twice and an operator notices.

## Outcome

One order remains, carrying every item, and the duplicate is cancelled.
