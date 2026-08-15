---
kind: edge
actors: [shopper, store-admin]
result: not-achieved
steps:
  - text: The shopper finds and selects an available product
    capability: catalog-browsing
    routes:
      web-to-admin: customer-web::storefront
      mobile-to-admin: customer-mobile::storefront
  - text: The shopper submits checkout and the order is placed
    capability: checkout
    routes:
      web-to-admin: customer-web::storefront
      mobile-to-admin: customer-mobile::storefront
  - text: Reconciliation shows the product cannot be fulfilled
  - text: The store admin cancels the order and the payment is released
    capability: order-management
    routes:
      web-to-admin: admin-web::admin-console
      mobile-to-admin: admin-web::admin-console
---

# Cancel an order before fulfilment

## Trigger

The shopper places an order for a product that stock reconciliation later finds
unavailable.

## Outcome

The Journey goal is not achieved: no confirmed order remains for the selected
product, and the shopper is not charged.
