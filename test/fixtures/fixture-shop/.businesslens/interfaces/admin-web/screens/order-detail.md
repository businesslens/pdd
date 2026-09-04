---
capabilities:
  - manage-orders
  - cancel-order
entities:
  - order
  - refund
entryPoints:
  - admin-web: /admin/orders/:id
references:
  - kind: code
    role: implementation
    target: src/routes/admin.ts
---

# Order detail

The console page where an operator resolves one order.

## Information presented

- The items ordered, the totals and the margin
- The order's state and any refund in progress

## Available actions

- Issue a refund
- Cancel the order
- Merge a duplicate into it

## Capability boundary

The page does not change catalog information or payment details.
