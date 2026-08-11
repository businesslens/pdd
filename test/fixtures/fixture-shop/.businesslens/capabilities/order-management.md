---
domain: ordering
availability:
  - interface: admin-web
    experiences: [admin-console]
  - interface: operator-cli
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService
---

# Order management

Lets a store administrator review and update existing orders.

## Intent

Give operators a controlled way to resolve order issues.
