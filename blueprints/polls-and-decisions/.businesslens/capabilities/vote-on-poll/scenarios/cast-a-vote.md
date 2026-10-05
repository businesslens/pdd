---
kind: primary
routes:
  web: Web
steps:
  - text: The poll is open and asks for a single choice
    kind: condition
    entities:
      - { entity: poll, effect: reads, facts: [Choice mode, Closed at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Member chooses one option and casts their vote
    kind: actor
    actor: member
    entities:
      - { entity: vote, effect: creates, facts: [Chosen options, Cast at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product counts the vote and shows it as the Member's own
    kind: product
    actor: member
    entities:
      - { entity: vote, effect: reads, facts: [Chosen options] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product takes the Member straight to the poll's results
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Results visibility] }
    contexts:
      web:
        place: polls-web::poll
---

# Cast a vote

## Trigger

A Member decides which option they support on an open poll.

## Outcome

The Member's vote counts toward the chosen option, the poll shows which option
the Member chose, and the Product has taken the Member straight to the poll's
results, which show as far as the poll allows.
