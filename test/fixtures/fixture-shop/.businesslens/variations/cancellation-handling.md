---
kind: configuration
of: capability
settings:
  - { entity: store-settings, fact: Cancellation handling }
takesEffect: When a shopper asks to cancel. A changed setting applies to later requests.
stability: A request already waiting for an operator is decided under the handling it was made under.
alternatives:
  - id: cancel-order
    selectedWhen: The store's Cancellation handling is Immediate, or not set.
  - id: request-cancellation
    selectedWhen: The store's Cancellation handling is On approval.
---

# Cancellation handling

A store either lets cancellations take effect at once or has an operator
approve each one. The two differ in who acts and where, so the Capabilities
vary rather than one of their Scenarios.
