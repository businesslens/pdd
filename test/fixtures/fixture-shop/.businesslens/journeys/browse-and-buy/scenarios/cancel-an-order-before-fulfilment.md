---
kind: edge
actors: [shopper, store-admin]
result: not-achieved
flow:
  - id: select-product
    capability: catalog-browsing
    operation: Find and select an available product
  - id: place-order
    capability: checkout
    operation: Submit payment and place the order
  - id: cancel-order
    capability: order-management
    operation: Cancel the order during stock reconciliation
routes:
  - id: web-to-admin
    contexts:
      - stage: select-product
        context: customer-web::storefront
      - stage: place-order
        context: customer-web::storefront
      - stage: cancel-order
        context: admin-web::admin-console
  - id: mobile-to-admin
    contexts:
      - stage: select-product
        context: customer-mobile::storefront
      - stage: place-order
        context: customer-mobile::storefront
      - stage: cancel-order
        context: admin-web::admin-console
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
