---
type: webhook
actors:
  - payment-gateway
entryPoints:
  - webhook: /webhooks/payments/v2
variantOf: payment-webhook
variationUsage:
  label: v2
  discriminator:
    entity: payment-gateway
    fact: Settlement contract
  selectedWhen: The gateway's Settlement contract is v2. The request must use the matching endpoint and payload. A missing or unsupported contract is rejected.
  takesEffect: For each new webhook request; the gateway switches only after its integration configuration changes.
  stability: Each request is interpreted using the selected contract through completion. Both contracts are live; existing receipts keep their original interpretation.
---

# Payment webhook v2

Receives settlements and refunds with an explicit event identifier and separate settlement and refund payload objects.
