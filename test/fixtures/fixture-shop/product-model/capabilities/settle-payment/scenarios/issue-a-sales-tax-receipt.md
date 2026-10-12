---
kind: primary
routes:
  webhook: Webhook
steps:
  - text: The payment gateway posts a settlement for a pending order
    kind: actor
    actor: payment-gateway
    entities:
      - { entity: order, effect: reads, facts: [] }
    contexts:
      webhook:
        place: payment-webhook
  - text: The Product issues a sales tax receipt for the settled order
    kind: product
    actor: payment-gateway
    entities:
      - { entity: order, effect: reads, facts: [Items ordered, Tax, Total charged] }
      - { entity: sales-tax-receipt, effect: creates, facts: [Receipt number, Sales tax amount] }
    contexts:
      webhook:
        place: payment-webhook
---

# Issue a sales tax receipt

## Trigger

The payment gateway reports that a pending order's charge has settled.

## Outcome

A sales tax receipt records the tax on the order and is kept for the store's tax filing.
