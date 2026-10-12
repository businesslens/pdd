---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The shopper finds and selects an available product
    kind: actor
    actor: shopper
    capability: browse-catalog
    entities:
      - { entity: catalog-product, effect: reads, facts: [Name and description, Price, Stock remaining] }
    contexts:
      web:
        place: customer-web::storefront::product-record
  - text: The shopper submits checkout
    kind: actor
    actor: shopper
    capability: place-order
    entities:
      - { entity: order, effect: creates, to: Pending, facts: [Items ordered, Delivery details, Subtotal, Tax, Discount, Total charged, Margin, When placed] }
      - { entity: cart, effect: removes }
    contexts:
      web:
        place: customer-web::storefront::product-record
  - text: The Product confirms the paid order
    kind: product
    actor: payment-gateway
    capability: settle-payment
    entities:
      - { entity: order, effect: changes, from: Pending, to: Confirmed, facts: [] }
    contexts:
      web:
        place: payment-webhook
  - text: The shopper is taken to the order's status
    kind: actor
    actor: shopper
    capability: track-order
    entities:
      - { entity: order, effect: reads, facts: [Items ordered, Total charged] }
    contexts:
      web:
        place: customer-web::storefront::order-status
---

# Buy and follow the order

## Trigger

The shopper wants to find and purchase an available product.

## Outcome

The Journey goal is achieved: the order is confirmed and the shopper sees its status.
