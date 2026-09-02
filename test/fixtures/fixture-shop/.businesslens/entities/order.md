---
relations:
  - entity: catalog-product
    verb: was placed for
    cardinality: many-to-many
  - entity: refund
    verb: is repaid by
    cardinality: one-to-many
domain: ordering
---

# Order

A shopper's confirmed intent to buy, from submission through settlement,
cancellation or refund.

## Information kept

- **Items ordered** — the quantity ordered of each product
- **Delivery details** — where and how this order is to be delivered
- **Subtotal** — the total before tax and discounts
- **Tax** — the tax charged
- **Discount** — the reduction applied
- **Total charged** — the amount taken from the shopper
- **Margin** — what the store earns on it
- **When placed** — when the shopper submitted it

## States

### Pending

Submitted and awaiting payment settlement. No stock has been committed yet.

### Confirmed

Paid and accepted. Stock is committed and the order is queued for fulfilment.

### Cancelled

Withdrawn before fulfilment — by its shopper while unpaid, by an operator, or by
the Product when payment never arrived. Any committed stock is released.

### Refunded

Reversed after confirmation. The shopper has been repaid and no fulfilment
follows.
