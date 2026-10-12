---
kind: edge
routes:
  without-stock: Without stock
steps:
  - text: The shopper reads the product without its remaining stock
    kind: actor
    actor: shopper
    entities:
      - entity: catalog-product
        effect: reads
        facts:
          - Name and description
          - Price
    contexts:
      without-stock:
        place: customer-web::storefront::product-record-without-stock
---

# Read a product without its stock

## Trigger

A Shopper assigned to the Hidden stock disclosure arm opens a product.

## Outcome

The Shopper reads the product's description and price without learning how many units remain.
