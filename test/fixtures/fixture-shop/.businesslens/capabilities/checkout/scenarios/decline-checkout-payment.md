---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The shopper submits checkout and the payment gateway declines the charge.
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
  - text: The payment gateway declines the charge
    kind: product
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The Product preserves the cart and explains that payment failed
    kind: product
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
references:
  - kind: code
    role: implementation
    target: src/services/payments.ts#PaymentGateway.charge
---

# Decline checkout payment

## Trigger

The shopper submits checkout and the payment gateway declines the charge.

## Outcome

No order is created and the shopper can retry checkout.
