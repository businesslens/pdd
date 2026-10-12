---
domain: ordering
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService
availability: [{ place: customer-web::storefront }, { place: customer-mobile::storefront }, { place: admin-web }]
---

# Order cancellation

Withdraws an order before it is fulfilled and releases whatever it held.

## Intent

Let a shopper change their mind while it is cheap, and let the store stop an
order it cannot fulfil.
