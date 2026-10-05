---
kind: edge
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
  - text: The poll shows its results only after closing
    kind: condition
    capability: view-results
    entities:
      - { entity: poll, effect: reads, facts: [Results visibility] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product shows the Member their own vote and when results will show
    kind: product
    actor: member
    capability: view-results
    entities:
      - { entity: vote, effect: reads, facts: [Chosen options] }
      - { entity: poll, effect: reads, facts: [Deadline] }
    contexts:
      web:
        place: polls-web::poll
---

# Vote while results are hidden

## Trigger

A Member votes on a poll whose results show only after it closes.

## Outcome

The Journey goal is achieved: the Member's vote is counted, and they know when
the results will show without seeing any count or anyone else's choice.
