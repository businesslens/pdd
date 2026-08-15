---
kind: primary
actors: [shopper]
result: achieved
steps:
  - text: The shopper finds and selects an available product
    capability: catalog-browsing
    routes:
      web: customer-web::storefront
      mobile: customer-mobile::storefront
  - text: The shopper submits checkout
    capability: checkout
    routes:
      web: customer-web::storefront
      mobile: customer-mobile::storefront
  - text: The Product confirms the paid order
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Browse and complete checkout

## Trigger

The shopper wants to find and purchase an available product.

## Outcome

The Journey goal is achieved: a confirmed order exists for the selected product.

## Handoff note

The report must preserve this supporting context after the structured Outcome.
