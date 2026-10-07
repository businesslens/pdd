---
kind: primary
result: achieved
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
      mobile:
        place: customer-mobile::storefront::product-record
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
      mobile:
        place: customer-mobile::storefront::product-record
  - text: A store operator confirms the paid order
    kind: actor
    actor: store-admin
    capability: confirm-order
    entities:
      - { entity: order, effect: changes, from: Pending, to: Confirmed, facts: [] }
    contexts:
      web:
        place: admin-web::order-detail
      mobile:
        place: admin-web::order-detail
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
routes:
  web: Web
  mobile: Mobile
---

# Browse and complete checkout with manual confirmation

## Trigger

The shopper wants to find and purchase an available product.

## Outcome

The Journey goal is achieved: an operator has confirmed the order for the selected product.
