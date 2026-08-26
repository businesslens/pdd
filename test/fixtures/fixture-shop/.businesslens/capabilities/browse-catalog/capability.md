---
entities:
  - catalog-product
references:
  - kind: code
    role: implementation
    target: src/services/catalog.ts#CatalogService
availability: [{ place: customer-web::storefront }, { place: customer-mobile::storefront }]
---

# Catalog browsing

Lets a shopper discover and inspect available products.

## Intent

Make product discovery possible before purchase.
