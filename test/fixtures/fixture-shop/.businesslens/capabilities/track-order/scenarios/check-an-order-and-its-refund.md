---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The shopper opens one of their orders
    kind: actor
    actor: shopper
    entities:
      - { entity: order, effect: reads }
    contexts:
      web:
        place: customer-web::storefront::order-status
      mobile:
        place: customer-mobile::storefront::order-status
  - text: The order's state and any refund are shown
    kind: product
    actor: shopper
    entities:
      - { entity: order, effect: reads }
      - { entity: refund, effect: reads }
    contexts:
      web:
        place: customer-web::storefront::order-status
      mobile:
        place: customer-mobile::storefront::order-status
---

# Check an order and its refund

## Trigger

A shopper wants to know where an order stands.

## Outcome

The shopper sees the order's state and whether any refund has settled.
