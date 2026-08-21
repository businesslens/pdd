---
capabilities:
  - catalog-browsing
  - checkout
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

Shows the information a shopper needs to evaluate one product.

## Intent

Help a shopper decide whether to add the product to the cart.

## Information presented

- Product name and description
- Price and availability

## Available actions

- Add the product to the cart
- Return to the catalog

## Product states

### Available

The product can be added to the cart.

### Unavailable

The reason it cannot be purchased is explained.

## Capability boundary

The screen does not change product or inventory data.
