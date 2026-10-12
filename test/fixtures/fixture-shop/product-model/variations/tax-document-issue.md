---
kind: configuration
of: capability-scenario
settings:
  - { entity: store-settings, fact: Tax region }
takesEffect: When an order settles. A changed Tax region applies to orders that settle afterwards.
stability: An issued document never changes when the Tax region does.
alternatives:
  - id: issue-a-vat-invoice
    selectedWhen: The store's Tax region is EU.
  - id: issue-a-sales-tax-receipt
    selectedWhen: The store's Tax region is US. A store with no Tax region issues neither.
---

# Tax document issue

Settlement creates whichever tax document the store keeps. Each Step names one concrete Entity, so the Tax document Variation carries into the Scenarios that create each document.
