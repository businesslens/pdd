---
kind: edge
routes:
  admin: Admin
steps:
  - text: An order has stayed unpaid past the payment window
    kind: condition
    unattended: true
    entities:
      - { entity: order, effect: reads }
  - text: The order is cancelled and its stock released
    kind: product
    entities:
      - { entity: order, effect: changes, from: Pending, to: Cancelled }
    contexts:
      admin:
        place: admin-web::order-detail
---

# Expire an unpaid order

## Trigger

The Product's own payment window closes on an order nobody has paid for.

## Outcome

The order is cancelled and its stock is released, and an operator can see why.
