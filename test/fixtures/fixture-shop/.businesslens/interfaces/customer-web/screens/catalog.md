---
capabilities:
  - browse-catalog
entities:
  - { entity: catalog-product, facts: [Name and description, Price] }
entryPoints:
  - customer-web: /
references:
  - kind: code
    role: implementation
    target: src/routes/storefront.ts#storefrontRoutes
---

# Catalog

The shop's front door: every product on sale and whether it can be bought,
reachable from anywhere in the web application rather than belonging to one
Experience of it. Buying starts on a product record.
