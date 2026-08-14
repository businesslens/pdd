---
domain: ordering
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
availability: [customer-web::storefront, customer-mobile::storefront]
---

# Checkout

Turns a valid cart into a confirmed order.

## Intent

Complete a purchase without confirming an unpaid order.
