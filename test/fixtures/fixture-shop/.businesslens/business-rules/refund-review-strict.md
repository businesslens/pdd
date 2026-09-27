---
variantOf: refund-review-standard
variationUsage:
  settings:
    - entity: store-settings
      fact: Refund review mode
  selectedWhen: Refund review mode is Strict. Missing mode uses Standard; unsupported values prevent a new refund from starting.
  takesEffect: When a refund is requested. A settings change applies to subsequent requests.
  stability: A refund already under review keeps the policy and threshold captured when it was requested.
appliesTo:
  - type: entity
    id: refund
    facts:
      - Amount
---

# Strict refund review

Every refund requires a recorded review before payment is returned, regardless of its amount.
