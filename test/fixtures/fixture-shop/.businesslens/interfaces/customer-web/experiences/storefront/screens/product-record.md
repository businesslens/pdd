---
capabilities:
  - browse-catalog
  - place-order
entities:
  - { entity: catalog-product, facts: [Name and description, Price, Stock remaining] }
  - { entity: cart, facts: [Quantity chosen] }
  - { entity: shopper, facts: [Delivery address] }
entryPoints:
  - customer-web: /products/:id
references:
  - kind: visual
    role: intent
    target: https://example.com/designs/product-record
    title: Product record visual reference
  - kind: code
    role: implementation
    target: src/routes/storefront.ts
---

# Product record

Shows the information a shopper needs to evaluate one product and, when it can
be bought, lets them add it to the cart and check out.

## Intent

Help a shopper decide whether to add the product to the cart.
