---
kind: configuration
of: journey-scenario
settings:
  - { entity: store-settings, fact: Order confirmation }
takesEffect: When an order's payment settles. A changed setting applies to orders settling afterwards.
stability: An order already confirmed stays confirmed when the setting changes.
alternatives:
  - id: browse-and-complete-checkout
    selectedWhen: The store's Order confirmation is Automatic, or not set.
  - id: browse-and-complete-checkout-with-manual-confirmation
    selectedWhen: The store's Order confirmation is Manual.
---

# Order confirmation

A store either confirms orders as soon as payment settles or has an operator
confirm each one. Only the last Step of the path differs, so two Scenarios of
Browse and buy vary.
