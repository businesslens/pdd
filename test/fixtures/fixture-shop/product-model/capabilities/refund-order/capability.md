---
domain: ordering
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.refund
availability: [{ place: admin-web }, { place: operator-cli }]
---

# Order refund

Lets a store administrator refund a confirmed order.

## Intent

Give operators a controlled way to return a shopper's money.
