---
kind: edge
routes:
  web: Web
  cli: CLI
steps:
  - text: The admin opens the order in the console
    kind: actor
    actor: store-admin
    contexts:
      web:
        place: admin-web
      cli:
        place: operator-cli
  - text: The refund is issued through the order service
    kind: product
    contexts:
      web:
        place: admin-web
      cli:
        place: operator-cli
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.refund
---

# Refund an order

## Trigger

A store admin receives an eligible refund request for an existing order.

## Outcome

The order is marked refunded and the shopper is notified.
