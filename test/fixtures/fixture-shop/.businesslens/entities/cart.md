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

- The quantity chosen of each product
- When it was last changed
