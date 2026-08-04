---
kind: edge
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.refund
---

# Refund an order

## Trigger

A shopper requests a refund for a delivered order.

## Steps

1. The admin opens the order in the console
2. The refund is issued through the order service

## Outcome

The order is marked refunded and the shopper is notified.
