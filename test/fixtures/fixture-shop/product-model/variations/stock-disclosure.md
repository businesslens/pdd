---
kind: experiment
of: screen
assignmentUnit:
  entity: shopper
assignmentMethod: Assign each signed-in Shopper randomly once when they first open a product. Store the arm on the Shopper; do not assign per page visit.
assignmentFact:
  entity: shopper
  fact: Product presentation assignment
allocation: Half of eligible Shoppers in each arm.
takesEffect: On the first product opening after sign-in. A changed assignment takes effect on the next visit, not midway through a product reading.
stability: The stored assignment persists across devices and visits until the experiment ends; an open product reading keeps its current form.
alternatives:
  - id: customer-web::storefront::product-record
    selectedWhen: The Shopper's Product presentation assignment is Shown. Guests and unassigned Shoppers use Shown; unsupported stored values are rejected.
  - id: customer-web::storefront::product-record-without-stock
    selectedWhen: The Shopper's Product presentation assignment is Hidden.
---

# Stock disclosure

Signed-in Shoppers either see how many units of a product remain or do not, so the store can compare whether knowing the stock leads to more confident purchases.
