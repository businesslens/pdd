---
kind: primary
journey: browse-and-buy
actors: [shopper]
result: achieved
flow:
  - capability: catalog-browsing
    operation: Find and select an available product
    availability:
      - interface: customer-web
        experiences: [storefront]
      - interface: customer-mobile
        experiences: [storefront]
  - capability: checkout
    operation: Submit payment and confirm the order
    availability:
      - interface: customer-web
        experiences: [storefront]
      - interface: customer-mobile
        experiences: [storefront]
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
