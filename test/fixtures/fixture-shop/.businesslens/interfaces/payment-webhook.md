---
type: webhook
actors: [payment-gateway]
entryPoints:
  - webhook: /webhooks/payments
references:
  - kind: code
    role: implementation
    target: src/services/payments.ts
---

# Payment webhook

The endpoint through which the payment gateway reports settlements and refunds.

## Capability boundary

Accepts settlement results. It does not expose orders or catalog information.
