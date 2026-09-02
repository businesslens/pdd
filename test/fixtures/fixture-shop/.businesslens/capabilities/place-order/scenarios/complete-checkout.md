---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The shopper submits checkout with a non-empty cart
    kind: actor
    actor: shopper
    entities:
      - { entity: cart, effect: reads }
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The shopper confirms the delivery address
    kind: actor
    actor: shopper
    entities:
      - { entity: shopper, effect: changes }
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The cart is validated against the catalog
    kind: product
    entities:
      - { entity: cart, effect: reads }
      - { entity: catalog-product, effect: reads }
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The payment gateway is asked to charge the total
    kind: product
    actor: shopper
    entities:
      - { entity: payment-gateway, effect: reads }
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The order is stored as pending and the cart is emptied
    kind: product
    actor: shopper
    entities:
      - { entity: order, effect: creates, to: Pending }
      - { entity: cart, effect: removes }
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
  - kind: code
    role: implementation
    target: src/services/payments.ts#PaymentGateway.charge
---

# Complete checkout

## Trigger

The shopper submits checkout with a non-empty cart.

## Decision points

### Payment authorization

How does the shopper authorize payment?

- saved method → charge the shopper's saved payment method
- new method → validate and charge the payment method provided at checkout

## Outcome

The order is stored as pending, awaiting settlement, and a confirmation is shown.

## Recovery note

Payment recovery remains supporting context rather than another structured field.
