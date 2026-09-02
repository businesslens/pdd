---
kind: edge
result: not-achieved
steps:
  - text: The shopper finds and selects an available product
    kind: actor
    actor: shopper
    capability: browse-catalog
    entities:
      - { entity: catalog-product, effect: reads }
    contexts:
      web-to-admin:
        place: customer-web::storefront::product-record
      mobile-to-admin:
        place: customer-mobile::storefront::product-record
  - text: The shopper submits checkout and the order is placed
    kind: actor
    actor: shopper
    capability: place-order
    entities:
      - { entity: order, effect: creates, to: Pending }
      - { entity: cart, effect: removes }
    contexts:
      web-to-admin:
        place: customer-web::storefront::product-record
      mobile-to-admin:
        place: customer-mobile::storefront::product-record
  - text: The payment settles and the order is confirmed
    kind: product
    actor: payment-gateway
    capability: settle-payment
    entities:
      - { entity: order, effect: changes, from: Pending, to: Confirmed }
    contexts:
      web-to-admin:
        place: payment-webhook
      mobile-to-admin:
        place: payment-webhook
  - text: Reconciliation shows the product cannot be fulfilled
    kind: condition
    entities: []
  - text: The store admin cancels the order and the payment is released
    kind: actor
    actor: store-admin
    capability: cancel-order
    entities:
      - { entity: order, effect: changes, from: Confirmed, to: Cancelled }
    contexts:
      web-to-admin:
        place: admin-web::order-detail
      mobile-to-admin:
        place: admin-web::order-detail
routes:
  web-to-admin: Web To Admin
  mobile-to-admin: Mobile To Admin
---

# Cancel an order before fulfilment

## Trigger

The shopper places an order for a product that stock reconciliation later finds
unavailable.

## Outcome

The Journey goal is not achieved: the order is cancelled and the shopper is
repaid before anything ships.
