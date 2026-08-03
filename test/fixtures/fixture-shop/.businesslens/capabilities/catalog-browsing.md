---
domain: catalog
availability:
  - interface: customer-web
    experiences: [storefront]
  - interface: customer-mobile
    experiences: [storefront]
references:
  - kind: code
    role: implementation
    target: src/services/catalog.ts#CatalogService
---

# Catalog browsing

Lets a shopper discover and inspect available products.

## Intent

Make product discovery possible before purchase.
