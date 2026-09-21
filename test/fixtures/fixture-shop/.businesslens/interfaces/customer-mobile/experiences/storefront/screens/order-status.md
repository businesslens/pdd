---
capabilities:
  - track-order
  - cancel-order
entities:
  - { entity: order, facts: [Items ordered, Total charged] }
  - { entity: refund, facts: [Amount] }
entryPoints:
  - customer-mobile: fixture-shop://orders/:id
---

# Order status

Shows a shopper where one of their orders stands: what was ordered and charged,
whether it is still unpaid and can be cancelled, and whether any refund has
settled.
