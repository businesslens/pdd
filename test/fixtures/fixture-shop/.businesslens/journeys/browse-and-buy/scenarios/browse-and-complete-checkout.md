---
kind: primary
result: achieved
steps:
  - text: The shopper finds and selects an available product
    kind: actor
    actor: shopper
    capability: browse-catalog
    entities:
      - { entity: catalog-product, effect: reads }
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The shopper submits checkout
    kind: actor
    actor: shopper
    capability: place-order
    entities:
      - { entity: order, effect: creates, to: Pending }
      - { entity: cart, effect: removes }
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The Product confirms the paid order
    kind: product
    actor: payment-gateway
    capability: settle-payment
    entities:
      - { entity: order, effect: changes, from: Pending, to: Confirmed }
    contexts:
      web:
        place: payment-webhook
      mobile:
        place: payment-webhook
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
routes:
  web: Web
  mobile: Mobile
---

# Browse and complete checkout

## Trigger

The shopper wants to find and purchase an available product.

## Outcome

The Journey goal is achieved: a confirmed order exists for the selected product.

## Handoff note

The report must preserve this supporting context after the structured Outcome.
