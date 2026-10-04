---
kind: configuration
of: entity
settings:
  - { entity: store-settings, fact: Tax region }
takesEffect: When an order settles. A changed Tax region applies to orders that settle afterwards.
stability: An issued document never changes when the Tax region does.
alternatives:
  - id: vat-invoice
    selectedWhen: The store's Tax region is EU.
  - id: sales-tax-receipt
    selectedWhen: The store's Tax region is US. A store with no Tax region issues neither.
---

# Tax document

A store keeps one kind of tax document for its settled orders, chosen by where it trades. The two keep different facts, so the thing itself varies, not only the behavior that creates it.
