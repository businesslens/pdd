---
type: webhook
actors:
  - payment-gateway
entryPoints:
  - webhook: /webhooks/payments/v2
---

# Payment webhook v2

Receives settlements and refunds with an explicit event identifier and separate settlement and refund payload objects.
