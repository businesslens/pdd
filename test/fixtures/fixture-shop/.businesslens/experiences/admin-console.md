---
actors: [store-admin]
interfaces: [admin-web]
access: restricted
entryPoints:
  - admin-web: /admin
---

# Admin console

Where store admins review and manage orders.

## Capability boundary

Requires an admin session; full order management including refunds.
