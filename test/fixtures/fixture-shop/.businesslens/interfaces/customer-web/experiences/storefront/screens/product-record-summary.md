---
variantOf: customer-web::storefront::product-record
variationUsage:
  assignmentUnit:
    entity: shopper
  assignmentFact:
    entity: shopper
    fact: Product presentation assignment
  assignmentMethod: Assign each signed-in Shopper randomly once when they first open a product. Store the arm on the Shopper; do not assign per page visit.
  allocation: 20% of eligible Shoppers in each of the five arms.
  selectedWhen: The Shopper's Product presentation assignment is Summary. Guests and unassigned Shoppers use Standard; unsupported stored values are rejected.
  takesEffect: On the first product opening after sign-in. A changed assignment takes effect on the next visit, not midway through a product reading.
  stability: The stored assignment persists across devices and visits until the experiment ends; an open product reading keeps its current form.
entities:
  - entity: catalog-product
    shows:
      - Name and description
      - Price
      - Stock remaining
---

# Product summary

A short product summary puts price and stock before the full description.
