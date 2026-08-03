---
domain: ordering
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

# Checkout

Turns a valid cart into a confirmed order.

## Intent

Complete a purchase without confirming an unpaid order.
