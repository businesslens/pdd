---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The shopper buys the last remaining unit of a product.
    kind: actor
    actor: shopper
    entities:
      - { entity: cart, effect: reads }
      - { entity: catalog-product, effect: reads }
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The order commits the last unit and no stock remains
    kind: product
    actor: shopper
    entities:
      - { entity: order, effect: creates, to: Pending }
      - { entity: catalog-product, effect: changes, from: Available, to: Unavailable }
      - { entity: cart, effect: removes }
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
  - text: The product stays browsable and explains that it cannot be bought
    kind: condition
    entities:
      - { entity: catalog-product, effect: reads }
    contexts:
      web:
        place: customer-web::storefront::product-record
      mobile:
        place: customer-mobile::storefront::product-record
---

# Sell the last available unit

## Trigger

The shopper buys a product with one unit of stock remaining.

## Outcome

The order is placed and the product can no longer be bought.
