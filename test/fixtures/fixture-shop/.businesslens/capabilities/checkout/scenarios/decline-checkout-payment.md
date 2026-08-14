---
kind: edge
actors: [shopper]
references:
  - kind: code
    role: implementation
    target: src/services/payments.ts#PaymentGateway.charge
availability: [customer-web::storefront, customer-mobile::storefront]
---

# Decline checkout payment

## Trigger

The shopper submits checkout and the payment gateway declines the charge.

## Steps

1. The cart is validated against the catalog
2. The payment gateway declines the charge
3. The Product preserves the cart and explains that payment failed

## Outcome

No order is created and the shopper can retry checkout.
