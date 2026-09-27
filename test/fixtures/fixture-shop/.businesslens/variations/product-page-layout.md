---
kind: experiment
of: screen
assignmentUnit:
  entity: shopper
assignmentMethod: Assign each signed-in Shopper randomly once when they first open a product. Store the arm on the Shopper; do not assign per page visit.
assignmentFact:
  entity: shopper
  fact: Product presentation assignment
allocation: 20% of eligible Shoppers in each of the five arms.
takesEffect: On the first product opening after sign-in. A changed assignment takes effect on the next visit, not midway through a product reading.
stability: The stored assignment persists across devices and visits until the experiment ends; an open product reading keeps its current form.
alternatives:
  - id: customer-web::storefront::product-record
    selectedWhen: The Shopper's Product presentation assignment is Standard. Guests and unassigned Shoppers use Standard; unsupported stored values are rejected.
  - id: customer-web::storefront::product-record-guided
    selectedWhen: The Shopper's Product presentation assignment is Guided.
  - id: customer-web::storefront::product-record-price-first
    selectedWhen: The Shopper's Product presentation assignment is Price-first.
  - id: customer-web::storefront::product-record-stock-first
    selectedWhen: The Shopper's Product presentation assignment is Stock-first.
  - id: customer-web::storefront::product-record-summary
    selectedWhen: The Shopper's Product presentation assignment is Summary.
---

# Product page layout

Signed-in Shoppers see one of five product page layouts so the store can compare which one leads to more confident purchases.
