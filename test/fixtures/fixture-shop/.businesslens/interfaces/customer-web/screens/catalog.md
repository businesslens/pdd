---
capabilities:
  - browse-catalog
entities:
  - catalog-product
entryPoints:
  - customer-web: /
references:
  - kind: code
    role: implementation
    target: src/routes/storefront.ts#storefrontRoutes
---

# Catalog

The shop's front door: every product on sale, reachable from anywhere in the
web application rather than belonging to one Experience of it.

## Information presented

- Every product currently on sale, with its price
- Whether each product is available to buy

## Available actions

- Open a product record

## Capability boundary

Listing only. Buying starts on a product record, and nothing here changes
catalog or stock information.
