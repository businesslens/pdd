---
capabilities:
  - manage-orders
  - cancel-order
entities:
  - { entity: order, facts: [Items ordered, Subtotal, Tax, Discount, Total charged, Margin] }
  - { entity: refund, facts: [Amount, Reason] }
entryPoints:
  - admin-web: /admin/orders/:id
references:
  - kind: code
    role: implementation
    target: src/routes/admin.ts
---

# Order detail

The console page where an operator resolves one order: what was ordered, what
it cost and earned, where it stands, and any refund in progress.
