---
entities:
  - { entity: catalog-product, shows: [Name and description, Price, Stock remaining] }
  - { entity: cart, shows: [Quantity chosen] }
  - { entity: shopper, shows: [Delivery address] }
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
variationKind: experiment
variationUsage:
  assignmentUnit:
    entity: shopper
  assignmentFact:
    entity: shopper
    fact: Product presentation assignment
  assignmentMethod: Assign each signed-in Shopper randomly once when they first open a product. Store the arm on the Shopper; do not assign per page visit.
  allocation: 20% of eligible Shoppers in each of the five arms.
  selectedWhen: The Shopper's Product presentation assignment is Standard. Guests and unassigned Shoppers use Standard; unsupported stored values are rejected.
  takesEffect: On the first product opening after sign-in. A changed assignment takes effect on the next visit, not midway through a product reading.
  stability: The stored assignment persists across devices and visits until the experiment ends; an open product reading keeps its current form.
---

# Product record

Shows the information a shopper needs to evaluate one product and, when it can
be bought, lets them add it to the cart and check out.

## Intent

Help a shopper decide whether to add the product to the cart.
