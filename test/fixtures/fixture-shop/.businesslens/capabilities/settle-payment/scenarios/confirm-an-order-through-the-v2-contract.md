---
kind: edge
routes:
  webhook: Webhook
steps:
  - text: The payment gateway posts a v2 settlement event with an event identifier for a pending order
    kind: actor
    actor: payment-gateway
    entities:
      - { entity: order, effect: reads, facts: [] }
    contexts:
      webhook:
        place: payment-webhook-v2
  - text: The order is confirmed and its stock committed
    kind: product
    actor: payment-gateway
    entities:
      - { entity: order, effect: changes, from: Pending, to: Confirmed, facts: [] }
    contexts:
      webhook:
        place: payment-webhook-v2
---

# Confirm an order through the v2 contract

## Trigger

The payment gateway reports that a pending order's charge has settled.

## Outcome

The order is confirmed and its stock is committed.
