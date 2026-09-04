---
kind: primary
routes:
  webhook: Webhook
steps:
  - text: The payment gateway posts a settlement for a pending order
    kind: actor
    actor: payment-gateway
    entities:
      - { entity: order, effect: reads }
    contexts:
      webhook:
        place: payment-webhook
  - text: The order is confirmed and its stock committed
    kind: product
    actor: payment-gateway
    entities:
      - { entity: order, effect: changes, from: Pending, to: Confirmed }
    contexts:
      webhook:
        place: payment-webhook
references:
  - kind: code
    role: implementation
    target: src/services/payments.ts#PaymentGateway
---

# Confirm an order when the gateway settles

## Trigger

The payment gateway reports that a pending order's charge has settled.

## Outcome

The order is confirmed and its stock is committed.
