---
domain: ordering
---

# Refund

Money returned to a shopper against one of their orders.

## Information kept

- **Amount** — what is repaid, never more than the order's charge
- **Reason** — why the operator issued it

## States

### Requested

Issued by an operator and handed to the payment gateway.

### Settled

The gateway has confirmed the money is on its way back to the shopper.
