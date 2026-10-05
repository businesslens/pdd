---
kind: primary
routes:
  web: Web
steps:
  - text: The poll the Member owns has closed and has no decision yet
    kind: condition
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Closed at] }
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Member chooses to write the decision themselves
    kind: actor
    actor: member
    entities:
      - { entity: decision, effect: creates, to: Draft, facts: [Final results, Generated draft] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product opens the empty draft for the Member with the final results beside it
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [Final results] }
    contexts:
      web:
        place: polls-web::decision
---

# Start a blank decision

## Trigger

The owner of a closed poll wants to write the decision in their own words.

## Outcome

An empty draft decision for the poll exists that only its owner can see, with
the final results kept on it and nothing generated. The owner is on the
draft, ready to write and record it.
