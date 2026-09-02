---
relations:
  - entity: catalog-product
    verb: holds
    cardinality: many-to-many
domain: ordering
---

# Cart

What a shopper has chosen but not yet bought. It survives between visits so a
recoverable failure never costs the selection.

## Information kept

- **Quantity chosen** — how many of each product the shopper has picked
- **When last changed** — when the selection last moved
