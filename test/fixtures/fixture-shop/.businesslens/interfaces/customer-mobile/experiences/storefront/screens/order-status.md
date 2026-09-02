---
capabilities:
  - track-order
  - cancel-order
entities:
  - order
  - refund
entryPoints:
  - customer-mobile: fixture-shop://orders/:id
---

# Order status

Shows a shopper where one of their orders stands.

## Information presented

- The items ordered and the total charged
- The order's state
- Any refund and whether it has settled

## Available actions

- Cancel the order while it is unpaid

## View states

### Unpaid

The order awaits settlement and can still be cancelled.

### Settled

Payment has settled; only an operator can change the order now.

## Capability boundary

The page does not change catalog information or payment details.
