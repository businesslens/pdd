---
kind: primary
routes:
  web: Web
steps:
  - text: The Member closes an open poll they own
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Deadline] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product explains that voting and discussion end for everyone and the final results will show
    kind: product
    actor: member
    entities: []
    contexts:
      web:
        place: polls-web::poll
  - text: The Member confirms closing the poll
    kind: actor
    actor: member
    entities:
      - { entity: poll, from: Open, to: Closed, facts: [Closed at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product shows the final results and invites the Member to record what the team decided
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Tally] }
    contexts:
      web:
        place: polls-web::poll
---

# Close a poll early

## Trigger

The poll's owner has heard enough to decide before the deadline, or the poll
has no deadline.

## Outcome

The poll is closed for every Member, its final results show to the whole team,
and its owner is invited to draft the decision.

## Edge cases

- The Member declines to confirm → the poll stays open and nothing changes.
