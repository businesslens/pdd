---
kind: version
of: interface
discriminator:
  entity: payment-gateway
  fact: Settlement contract
takesEffect: For each new webhook request; the gateway switches only after its integration configuration changes.
stability: Each request is interpreted using the selected contract through completion. Both contracts are live; existing receipts keep their original interpretation.
alternatives:
  - id: payment-webhook
    label: v1
    selectedWhen: The gateway's Settlement contract is v1. The request must use the matching endpoint and payload. A missing or unsupported contract is rejected.
  - id: payment-webhook-v2
    label: v2
    selectedWhen: The gateway's Settlement contract is v2. The request must use the matching endpoint and payload. A missing or unsupported contract is rejected.
---

# Payment webhook contract

Both settlement contracts stay live while the payment gateway migrates, so each webhook request is read with the contract the gateway is configured for.
