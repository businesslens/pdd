---
entities:
  - cart
  - catalog-product
  - order
domain: ordering
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
availability: [{ place: customer-web::storefront }, { place: customer-mobile::storefront }]
---

# Checkout

Turns a valid cart into a confirmed order.

## Intent

Complete a purchase without confirming an unpaid order.
