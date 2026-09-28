---
kind: configuration
of: experience
settings:
  - { entity: store-settings, fact: Mobile selling }
takesEffect: When the mobile app starts. A changed setting applies from the next launch.
stability: A running app keeps its context until it restarts; a cart built on the web is untouched.
alternatives:
  - id: customer-mobile::storefront
    selectedWhen: The store's Mobile selling is on.
  - id: customer-mobile::catalog-preview
    selectedWhen: The store's Mobile selling is off, or not yet set.
---

# Mobile storefront

A store either sells in its mobile app or uses the app only to show its
catalog. The two contexts offer different Capabilities to the same Shoppers, so
the Experiences vary; each keeps its own place under the Customer mobile
application.
