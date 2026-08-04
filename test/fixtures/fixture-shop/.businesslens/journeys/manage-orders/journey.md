---
actors: [store-admin]
capabilities: [order-management]
availability:
  - interface: admin-web
    experiences: [admin-console]
entryPoints:
  - admin-web: /admin
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService
---

# Manage orders

A store admin reviews incoming orders and issues refunds when needed.
