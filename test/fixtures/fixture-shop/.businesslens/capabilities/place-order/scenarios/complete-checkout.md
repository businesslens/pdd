---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The shopper presses "Place order" with a non-empty cart.
    kind: actor
    actor: shopper
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The cart is validated against the catalog
    kind: product
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The payment gateway charges the total
    kind: product
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The order is persisted
    kind: product
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

The shopper presses "Place order" with a non-empty cart.

## Decision points

### Payment authorization

How does the shopper authorize payment?

- saved method → charge the shopper's saved payment method
- new method → validate and charge the payment method provided at place-order

## Outcome

The order is stored and a confirmation is shown.

## Recovery note

Payment recovery remains supporting context rather than another structured field.
