---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Member chooses an option on an open poll and casts their vote
    kind: actor
    actor: member
    capability: vote-on-poll
    entities:
      - { entity: poll, effect: reads, facts: [Choice mode, Closed at] }
      - { entity: vote, effect: creates, facts: [Chosen options, Cast at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product takes the Member straight to the poll's results
    kind: product
    actor: member
    capability: vote-on-poll
    entities:
      - { entity: poll, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The poll shows its results while open
    kind: condition
    capability: view-results
    entities:
      - { entity: poll, effect: reads, facts: [Results visibility] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product shows the count each option holds, the Member's choice included
    kind: product
    actor: member
    capability: view-results
    entities:
      - { entity: poll, effect: reads, facts: [Tally] }
    contexts:
      web:
        place: polls-web::poll
---

# Vote and see where the team stands

## Trigger

A Member opens a poll that is waiting for their vote.

## Outcome

The Journey goal is achieved: the Member's vote is counted and they see the
current results.
