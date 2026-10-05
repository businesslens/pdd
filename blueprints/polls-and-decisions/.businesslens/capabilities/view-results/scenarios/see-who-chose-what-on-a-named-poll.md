---
kind: edge
routes:
  web: Web
steps:
  - text: The poll's ballot is named and its results are showing
    kind: condition
    entities:
      - { entity: poll, effect: reads, facts: [Ballot, Results visibility, Closed at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Member opens the poll's results
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Tally] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product lists, under each option, the display name of every Member whose vote chose it
    kind: product
    actor: member
    entities:
      - { entity: vote, effect: reads, facts: [Chosen options] }
      - { entity: member, effect: reads, facts: [Display name] }
    contexts:
      web:
        place: polls-web::poll
---

# See who chose what on a named poll

## Trigger

A Member wants to know where each teammate stands on a named poll.

## Outcome

The Member sees the count for every option and, under it, who chose it.

## Edge cases

- The poll shows results only after closing and is still open → no names show until it closes.
