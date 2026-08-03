---
domains: [ordering]
capabilities: [checkout]
journeys: [browse-and-buy]
scenarios: [complete-checkout]
references:
  - kind: code
    role: implementation
    target: src/services/payments.ts#PaymentGateway.charge
---

# Payment before confirmation

An order is confirmed only after its payment succeeds.

## Intent

Never create a fulfilled customer promise without a successful charge.

## Rationale

Confirmation is the durable customer-facing boundary of checkout.
