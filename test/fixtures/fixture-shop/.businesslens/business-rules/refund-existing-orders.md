---
domains: [ordering]
capabilities: [order-management]
journeys: [manage-orders]
scenarios: [refund-order]
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.refund
---

# Refund existing orders

A refund can be issued only for an existing eligible order.

## Intent

Prevent refunds that cannot be reconciled to a customer order.

## Rationale

The order is the audit boundary for the refund.
