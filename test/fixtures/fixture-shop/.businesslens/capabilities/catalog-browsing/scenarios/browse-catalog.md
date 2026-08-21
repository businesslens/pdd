---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The catalog is listed
    kind: product
    places:
      web: customer-web::storefront::product-record
      mobile: customer-mobile::storefront::product-record
  - text: The shopper opens a product page
    kind: actor
    actor: shopper
    places:
      web: customer-web::storefront::product-record
      mobile: customer-mobile::storefront::product-record
references:
  - kind: code
    role: implementation
    target: src/services/catalog.ts#CatalogService.list
  - kind: code
    role: implementation
    target: src/routes/storefront.ts:1-3
---

# Browse the catalog

## Trigger

The shopper opens the storefront.

## Outcome

The shopper sees product details and can add them to the cart.
