---
kind: edge
result: not-achieved
steps:
  - text: The shopper finds and selects an available product
    kind: actor
    actor: shopper
    capability: catalog-browsing
    contexts:
      web-to-admin:
        place: customer-web::storefront::product-record
      mobile-to-admin:
        place: customer-mobile::storefront::product-record
  - text: The shopper submits checkout and the order is placed
    kind: actor
    actor: shopper
    capability: checkout
    contexts:
      web-to-admin:
        place: customer-web::storefront::product-record
      mobile-to-admin:
        place: customer-mobile::storefront::product-record
  - text: Reconciliation shows the product cannot be fulfilled
    kind: condition
  - text: The store admin cancels the order and the payment is released
    kind: actor
    actor: store-admin
    capability: order-management
    contexts:
      web-to-admin:
        place: admin-web::admin-console
      mobile-to-admin:
        place: admin-web::admin-console
routes:
  web-to-admin: Web To Admin
  mobile-to-admin: Mobile To Admin
---

# Cancel an order before fulfilment

## Trigger

The shopper places an order for a product that stock reconciliation later finds
unavailable.

## Outcome

The Journey goal is not achieved: no confirmed order remains for the selected
product, and the shopper is not charged.
