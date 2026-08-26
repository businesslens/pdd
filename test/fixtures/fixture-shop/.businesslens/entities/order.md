---
domain: ordering
---

# Order

A shopper's confirmed intent to buy, from submission through fulfilment or
refund.

## Information kept

- The items ordered and their quantities
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

## Transitions

- Pending → Confirmed by place-order
- Confirmed → Refunded by manage-orders
