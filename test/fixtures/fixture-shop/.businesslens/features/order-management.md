---
domain: ordering
actors: [store-admin]
experiences: [admin-console]
businessRules: [refund-existing-orders]
codeRefs:
  - src/services/orders.ts#OrderService
---

# Order management

Lets a store administrator review and update existing orders.

## Intent

Give operators a controlled way to resolve order issues.
