---
kind: experiment
of: capability-scenario
assignmentUnit:
  entity: shopper
assignmentMethod: Assign each signed-in Shopper randomly once, at their first checkout. Store the arm on the Shopper.
assignmentFact:
  entity: shopper
  fact: Checkout assignment
allocation: Half of eligible Shoppers in each arm.
takesEffect: When a signed-in Shopper first submits checkout. Guests always confirm their address.
stability: The stored assignment holds across devices until the experiment ends; a checkout already in progress keeps its form.
alternatives:
  - id: complete-checkout
    selectedWhen: The Shopper's Checkout assignment is Review, or the Shopper is a guest or unassigned.
  - id: complete-checkout-without-review
    selectedWhen: The Shopper's Checkout assignment is Skip review.
---

# Checkout review

Signed-in Shoppers either confirm their delivery address during checkout or go straight to payment with their saved address, so the store can compare completed purchases against wrong deliveries. Only that one Step differs, so the alternatives are two Scenarios of Checkout rather than two Capabilities.
