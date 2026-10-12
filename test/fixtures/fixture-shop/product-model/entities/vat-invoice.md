---
relations:
  - entity: order
    verb: is issued for
    cardinality: one-to-one
domain: ordering
---

# VAT invoice

The invoice an EU store issues for a settled order, showing the VAT charged.

## Information kept

- **Invoice number** — the store's sequential number for the invoice
- **VAT amount** — the value-added tax included in the total charged
- **Buyer VAT number** — the shopper's VAT registration, when they gave one
