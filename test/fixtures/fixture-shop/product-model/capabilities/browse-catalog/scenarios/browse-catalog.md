---
kind: primary
routes:
  web: Web
  mobile: Mobile
  preview: Mobile catalog preview
steps:
  - text: The catalog is listed
    kind: product
    entities:
      - { entity: catalog-product, effect: reads, facts: [Name and description, Price, Stock remaining] }
    contexts:
      web:
        place: customer-web::catalog
      mobile:
        place: customer-mobile::storefront::product-record
      preview:
        place: customer-mobile::catalog-preview
  - text: The shopper opens a product page
    kind: actor
    actor: shopper
    entities:
      - { entity: catalog-product, effect: reads, facts: [Name and description, Price, Stock remaining] }
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
      preview:
        place: customer-mobile::catalog-preview
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
