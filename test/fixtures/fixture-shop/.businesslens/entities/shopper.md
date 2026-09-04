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
