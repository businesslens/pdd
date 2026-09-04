---
domain: ordering
references:
  - kind: code
    role: implementation
    target: src/services/payments.ts#PaymentGateway
availability: [{ place: payment-webhook }]
---

# Payment settlement

Takes the payment gateway's word for what has been paid and what has been
repaid.

## Intent

Confirm an order only once the money has actually moved.
