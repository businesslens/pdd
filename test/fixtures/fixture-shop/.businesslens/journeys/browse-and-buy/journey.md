---
domain: ordering
actors: [shopper]
experiences: [storefront]
features: [catalog-browsing, checkout]
entryPoints:
  - web: src/routes/storefront.ts
codeRefs:
  - src/services/catalog.ts#CatalogService
  - src/services/orders.ts#OrderService.submit
---

# Browse and buy

A shopper finds a product in the catalog and completes checkout.
