---
actors: [shopper]
capabilities: [catalog-browsing, checkout]
availability:
  - interface: customer-web
    experiences: [storefront]
  - interface: customer-mobile
    experiences: [storefront]
entryPoints:
  - customer-web: /
  - customer-mobile: fixture-shop://storefront
references:
  - kind: code
    role: implementation
    target: src/services/catalog.ts#CatalogService
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Browse and buy

A shopper finds a product in the catalog and completes checkout.
