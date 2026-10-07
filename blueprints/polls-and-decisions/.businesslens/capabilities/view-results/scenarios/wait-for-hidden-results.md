---
kind: edge
routes:
  web: Web
steps:
  - text: The poll is open and shows its results only after closing
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
  - text: The Product explains that results stay hidden until voting ends, and when that is due if the poll has a deadline
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Results visibility, Deadline] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product shows the Member only their own vote
    kind: product
    actor: member
    entities:
      - { entity: vote, effect: reads, facts: [Chosen options] }
    contexts:
      web:
        place: polls-web::poll
---

# Wait for hidden results

## Trigger

A Member looks for the results of an open poll whose results show only after
closing.

## Outcome

The Member sees no counts and no other Member's choice, knows when results will
show, and still sees their own vote.

## Edge cases

- The Member is the poll's owner → the results are hidden from them the same way.
