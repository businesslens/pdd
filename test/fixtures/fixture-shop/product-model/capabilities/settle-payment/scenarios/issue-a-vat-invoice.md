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
  - text: The Product issues a VAT invoice for the settled order
    kind: product
    actor: payment-gateway
    entities:
      - { entity: order, effect: reads, facts: [Items ordered, Tax, Total charged] }
      - { entity: vat-invoice, effect: creates, facts: [Invoice number, VAT amount] }
    contexts:
      webhook:
        place: payment-webhook
---

# Issue a VAT invoice

## Trigger

The payment gateway reports that a pending order's charge has settled.

## Outcome

A VAT invoice records the tax on the order and is kept for the store's tax filing.
