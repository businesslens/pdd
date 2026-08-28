---
domain: model-authoring
relations:
  - entity: experience
    verb: holds
    cardinality: many
  - entity: screen
    verb: holds
    cardinality: many
---

# Interface

A supported inbound interaction contract — a web application, a CLI, a partner
API, an agent skill surface. Where Actors reach the Product.

## Information kept

- Its one interaction type, from a closed vocabulary
- The Actors it admits
- The product-facing addresses it answers on
- What it supports, and what it explicitly does not
