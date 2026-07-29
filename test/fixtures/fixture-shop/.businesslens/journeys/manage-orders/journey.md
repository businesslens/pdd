---
domain: ordering
actors: [store-admin]
experiences: [admin-console]
features: [order-management]
entryPoints:
  - web: src/routes/admin.ts
codeRefs:
  - src/services/orders.ts#OrderService
---

# Manage orders

A store admin reviews incoming orders and issues refunds when needed.
