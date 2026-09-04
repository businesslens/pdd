---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: Self-service cancellation is switched on for the store
    kind: condition
    entities:
      - { entity: store-settings, effect: reads }
  - text: The shopper cancels an order that has not been paid
    kind: actor
    actor: shopper
    entities:
      - { entity: order, effect: reads }
    contexts:
      web:
        place: customer-web::storefront::order-status
      mobile:
        place: customer-mobile::storefront::order-status
  - text: The order is cancelled and its stock released
    kind: product
    actor: shopper
    entities:
      - { entity: order, effect: changes, from: Pending, to: Cancelled }
    contexts:
      web:
        place: customer-web::storefront::order-status
      mobile:
        place: customer-mobile::storefront::order-status
---

# Cancel your own unpaid order

## Trigger

A shopper changes their mind before payment has settled.

## Outcome

The order is cancelled and nothing is charged.
