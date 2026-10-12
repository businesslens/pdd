---
kind: primary
routes:
  web: Web
steps:
  - text: The poll has closed and its ballot is anonymous
    kind: condition
    entities:
      - { entity: poll, effect: reads, facts: [Ballot, Closed at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Member opens the poll's results
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Options] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product shows the final count for each option and when voting ended
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Tally, Closed at] }
    contexts:
      web:
        place: polls-web::poll
---

# See the final results

## Trigger

A Member wants to know how a closed poll came out.

## Outcome

The Member sees the final count for every option, with no way to tell who chose
what.
