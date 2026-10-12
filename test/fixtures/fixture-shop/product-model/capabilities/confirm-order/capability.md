---
domain: ordering
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService
availability: [{ place: admin-web }]
---

# Order confirmation

Lets a store administrator confirm a paid order by hand.

## Intent

Give operators the final say on an order the store confirms manually.
