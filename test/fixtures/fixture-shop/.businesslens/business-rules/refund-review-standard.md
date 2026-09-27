---
variationKind: configuration
variationUsage:
  settings:
    - entity: store-settings
      fact: Refund review mode
    - entity: store-settings
      fact: Refund approval threshold
  selectedWhen: Refund review mode is Standard. Missing mode uses Standard; unsupported values prevent a new refund from starting.
  takesEffect: When a refund is requested. A settings change applies to subsequent requests.
  stability: A refund already under review keeps the policy and threshold captured when it was requested.
appliesTo:
  - type: entity
    id: refund
    facts:
      - Amount
---

# Standard refund review

Refunds above the Store settings' Refund approval threshold require a recorded review before payment is returned.
