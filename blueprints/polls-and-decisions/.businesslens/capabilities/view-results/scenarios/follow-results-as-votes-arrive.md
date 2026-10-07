---
kind: primary
routes:
  web: Web
steps:
  - text: The poll is open and shows its results while open
    kind: condition
    entities:
      - { entity: poll, effect: reads, facts: [Results visibility, Closed at] }
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
  - text: The Product shows the count each option holds so far
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Tally] }
    contexts:
      web:
        place: polls-web::poll
---

# Follow results as votes arrive

## Trigger

A Member wants to know where the team stands before voting ends.

## Outcome

The Member sees the current count for every option, and it reflects every vote
cast or changed up to that moment.

## Edge cases

- Nobody has voted yet → every option shows zero.
