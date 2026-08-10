---
kind: edge
journey: browse-and-buy
actors: [shopper, store-admin]
result: not-achieved
flow:
  - capability: catalog-browsing
    operation: Find and select an available product
    availability:
      - interface: customer-web
        experiences: [storefront]
      - interface: customer-mobile
        experiences: [storefront]
  - capability: checkout
    operation: Submit payment and place the order
    availability:
      - interface: customer-web
        experiences: [storefront]
      - interface: customer-mobile
        experiences: [storefront]
  - capability: order-management
    operation: Cancel the order during stock reconciliation
    availability:
      - interface: admin-web
        experiences: [admin-console]
---

# Cancel an order before fulfilment

## Trigger

The shopper places an order for a product that stock reconciliation later finds
unavailable.

## Steps

1. The shopper finds and selects an available product
2. The shopper submits checkout and the order is placed
3. Reconciliation shows the product cannot be fulfilled
4. The store admin cancels the order and the payment is released

## Outcome

The Journey goal is not achieved: no confirmed order remains for the selected
product, and the shopper is not charged.
