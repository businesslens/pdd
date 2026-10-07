---
domain: ordering
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService
availability: [{ place: admin-web }, { place: operator-cli }]
---

# Order merging

Lets a store administrator merge a duplicate unpaid order into the original.

## Intent

Give operators a controlled way to resolve an order placed twice.
