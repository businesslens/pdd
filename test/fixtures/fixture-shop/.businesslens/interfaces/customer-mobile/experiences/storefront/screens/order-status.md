---
entities:
  - { entity: order, shows: [Items ordered, Total charged] }
  - { entity: refund, shows: [Amount] }
entryPoints:
  - customer-mobile: fixture-shop://orders/:id
---

# Order status

Shows a shopper where one of their orders stands: what was ordered and charged,
whether it is still unpaid and can be cancelled, and whether any refund has
settled.
