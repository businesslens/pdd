---
domain: ordering
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
availability: [{ place: customer-web::storefront }, { place: customer-mobile::storefront }]
---

# Checkout

Turns a valid cart into an order awaiting settlement.

## Intent

Complete a purchase without confirming an unpaid order.
