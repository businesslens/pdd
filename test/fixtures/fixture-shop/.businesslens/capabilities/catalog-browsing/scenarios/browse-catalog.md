---
kind: primary
actors: [shopper]
references:
  - kind: code
    role: implementation
    target: src/services/catalog.ts#CatalogService.list
  - kind: code
    role: implementation
    target: src/routes/storefront.ts:1-3
availability: [customer-web::storefront, customer-mobile::storefront]
---

# Browse the catalog

## Trigger

The shopper opens the storefront.

## Steps

1. The catalog is listed
2. The shopper opens a product page

## Outcome

The shopper sees product details and can add them to the cart.
