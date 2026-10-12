---
kind: person
acts: external
relations:
  - entity: order
    verb: owns
    cardinality: one-to-many
references:
  - kind: code
    role: implementation
    target: src/routes/storefront.ts
---

# Shopper

A visitor who browses the catalog and buys products.

## Information kept

- **Delivery address** — where their orders are sent unless an order says otherwise

- **Product presentation assignment** — whether the stock disclosure experiment shows this shopper the remaining stock
- **Checkout assignment** — whether the checkout review experiment asks this shopper to confirm the delivery address
- **Post-purchase assignment** — whether the post-purchase experiment takes this shopper on to order tracking
