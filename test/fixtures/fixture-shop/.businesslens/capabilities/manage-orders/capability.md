---
entities:
  - order
domain: ordering
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService
availability: [{ place: admin-web }, { place: operator-cli }]
---

# Order management

Lets a store administrator review and update existing orders.

## Intent

Give operators a controlled way to resolve order issues.
