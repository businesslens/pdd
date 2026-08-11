---
kind: primary
journey: browse-and-buy
actors: [shopper]
result: achieved
flow:
  - id: select-product
    capability: catalog-browsing
    operation: Find and select an available product
  - id: complete-checkout
    capability: checkout
    operation: Submit payment and confirm the order
routes:
  - id: web
    contexts:
      - stage: select-product
        interface: customer-web
        experience: storefront
      - stage: complete-checkout
        interface: customer-web
        experience: storefront
  - id: mobile
    contexts:
      - stage: select-product
        interface: customer-mobile
        experience: storefront
      - stage: complete-checkout
        interface: customer-mobile
        experience: storefront
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Browse and complete checkout

## Trigger

The shopper wants to find and purchase an available product.

## Steps

1. The shopper finds and selects an available product
2. The shopper submits checkout
3. The Product confirms the paid order

## Outcome

The Journey goal is achieved: a confirmed order exists for the selected product.

## Handoff note

The report must preserve this supporting context after the structured Outcome.
