---
kind: primary
codeRefs:
  - src/services/orders.ts#OrderService.submit
  - src/services/payments.ts#PaymentGateway.charge
---

# Complete checkout

## Trigger

The shopper presses "Place order" with a non-empty cart.

## Steps

1. The cart is validated against the catalog
2. The payment gateway charges the total
3. The order is persisted

## Outcome

The order is stored and a confirmation is shown.

## Edge cases

- Payment declined → the cart is preserved and an error is shown
