---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The shopper places an order for the last remaining unit of a product.
    kind: actor
    actor: shopper
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The order commits the last unit and no stock remains
    kind: product
    changes:
      - entity: catalog-product
        state: Unavailable
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The product stays browsable and explains that it cannot be bought
    kind: condition
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
---

# Sell the last available unit

## Trigger

The shopper places an order for a product with one unit of stock remaining.

## Outcome

The order is placed and the product can no longer be bought.
