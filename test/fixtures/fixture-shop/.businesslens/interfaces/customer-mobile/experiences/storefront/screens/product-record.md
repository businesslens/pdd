---
capabilities:
  - browse-catalog
  - place-order
entities:
  - catalog-product
  - cart
entryPoints:
  - customer-mobile: fixture-shop://products/:id
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

## View states

### Ready to buy

The price and stock are shown with an active control for adding to the cart.

### Purchase blocked

The control is inert and the reason the product cannot be bought is explained
in its place.

## Capability boundary

The screen does not change product or inventory data.
