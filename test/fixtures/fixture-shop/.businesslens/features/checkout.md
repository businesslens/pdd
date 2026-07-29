---
domain: ordering
actors: [shopper]
experiences: [storefront]
businessRules: [payment-before-confirmation]
codeRefs:
  - src/services/orders.ts#OrderService.submit
---

# Checkout

Turns a valid cart into a confirmed order.

## Intent

Complete a purchase without confirming an unpaid order.
