---
actors: [shopper]
access: public
entryPoints:
  - web: /
exit: "Order confirmed and receipt shown"
---

# Storefront

The public web store where shoppers browse and buy.

## Capability boundary

Anonymous browsing; checkout creates an order. No administrative actions.
