---
relations:
  - entity: catalog-product
    verb: was placed for
    cardinality: many-to-many
transitions:
  - from: Pending
    to: Confirmed
    by: place-order
  - from: Confirmed
    to: Refunded
    by: manage-orders
domain: ordering
---

# Order

A shopper's confirmed intent to buy, from submission through fulfilment or
refund.

## Information kept

- The quantity ordered of each product
- The total charged
- When it was placed
- Which shopper placed it

## States

### Pending

Submitted and awaiting payment settlement. No stock has been committed yet.

### Confirmed

Paid and accepted. Stock is committed and the order is queued for fulfilment.

### Refunded

Reversed after confirmation. The shopper has been repaid and no fulfilment
follows.
