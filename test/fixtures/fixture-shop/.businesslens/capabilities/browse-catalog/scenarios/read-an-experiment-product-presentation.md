---
kind: edge
routes:
  summary: summary
  price-first: price-first
  stock-first: stock-first
  guided: guided
steps:
  - text: The shopper reads the selected product presentation
    kind: actor
    actor: shopper
    entities:
      - entity: catalog-product
        effect: reads
        facts:
          - Name and description
          - Price
          - Stock remaining
    contexts:
      summary:
        place: customer-web::storefront::product-record-summary
      price-first:
        place: customer-web::storefront::product-record-price-first
      stock-first:
        place: customer-web::storefront::product-record-stock-first
      guided:
        place: customer-web::storefront::product-record-guided
---

# Read an experiment product presentation

## Trigger

A Shopper assigned to one of the alternative product presentations opens a product.

## Outcome

The Shopper can read the same product facts in their assigned presentation.
