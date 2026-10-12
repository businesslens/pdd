---
domain: ordering
references:
  - kind: code
    role: implementation
    target: src/services/payments.ts#PaymentGateway
availability: [{ place: payment-webhook }, { place: payment-webhook-v2 }]
---

# Payment settlement

Takes the payment gateway's word for what has been paid and what has been
repaid.

## Intent

Confirm an order only once the money has actually moved.
