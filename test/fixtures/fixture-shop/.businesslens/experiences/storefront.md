---
actors: [shopper]
interfaces: [customer-web, customer-mobile]
access: public
entryPoints:
  - customer-web: /
  - customer-mobile: fixture-shop://storefront
---

# Shopping

The customer shopping experience shared by web and mobile.

## Capability boundary

Browsing is public; checkout creates an order. No administrative actions.
