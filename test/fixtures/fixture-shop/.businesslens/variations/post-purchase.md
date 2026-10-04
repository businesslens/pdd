---
kind: experiment
of: journey
assignmentUnit:
  entity: shopper
assignmentMethod: Assign each signed-in Shopper randomly once, at their first purchase. Store the arm on the Shopper.
assignmentFact:
  entity: shopper
  fact: Post-purchase assignment
allocation: Half of eligible Shoppers in each arm.
takesEffect: When a signed-in Shopper completes their first purchase after the experiment starts.
stability: The stored assignment holds until the experiment ends.
alternatives:
  - id: browse-and-buy
    selectedWhen: The Shopper's Post-purchase assignment is Confirm only, or the Shopper is a guest or unassigned.
  - id: browse-buy-and-track
    selectedWhen: The Shopper's Post-purchase assignment is Track.
---

# Post-purchase

The store tests whether taking Shoppers straight on to order tracking after
buying reduces "where is my order" questions. One arm crosses a Capability the
other does not, so the Journeys vary rather than their Scenarios.
