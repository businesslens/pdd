---
kind: edge
actors: [store-admin]
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.refund
availability: [admin-web::admin-console, operator-cli]
---

# Refund an order

## Trigger

A store admin receives an eligible refund request for an existing order.

## Steps

1. The admin opens the order in the console
2. The refund is issued through the order service

## Outcome

The order is marked refunded and the shopper is notified.
