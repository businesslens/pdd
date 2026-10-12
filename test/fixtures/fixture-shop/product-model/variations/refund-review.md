---
kind: configuration
of: business-rule
settings:
  - entity: store-settings
    fact: Refund review mode
takesEffect: When a refund is requested. A settings change applies to subsequent requests.
stability: A refund already under review keeps the policy captured when it was requested.
alternatives:
  - id: refund-review-standard
    selectedWhen: Refund review mode is Standard. Missing mode uses Standard; unsupported values prevent a new refund from starting.
  - id: refund-review-strict
    selectedWhen: Refund review mode is Strict.
---

# Refund review

Stores choose how strictly refunds are reviewed before payment is returned; both policies are supported, and each store's Refund review mode selects one.
