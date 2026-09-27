---
type: webhook
actors: [payment-gateway]
entryPoints:
  - webhook: /webhooks/payments
references:
  - kind: code
    role: implementation
    target: src/services/payments.ts
variationKind: version
variationUsage:
  label: v1
  discriminator:
    entity: payment-gateway
    fact: Settlement contract
  selectedWhen: The gateway's Settlement contract is v1. The request must use the matching endpoint and payload. A missing or unsupported contract is rejected.
  takesEffect: For each new webhook request; the gateway switches only after its integration configuration changes.
  stability: Each request is interpreted using the selected contract through completion. Both contracts are live; existing receipts keep their original interpretation.
---

# Payment webhook

The endpoint through which the payment gateway reports settlements and refunds.
