---
kind: primary
routes:
  web: Web
steps:
  - text: An open poll's deadline passes
    kind: condition
    unattended: true
    entities:
      - { entity: poll, effect: reads, facts: [Deadline] }
  - text: The Product closes the poll on its own
    kind: product
    entities:
      - { entity: poll, from: Open, to: Closed, facts: [Closed at] }
  - text: The poll is shown closed, with when voting ended, the next time anyone opens it
    kind: condition
    entities:
      - { entity: poll, effect: reads, facts: [Closed at] }
    contexts:
      web:
        place: polls-web::poll
---

# Close a poll at its deadline

## Trigger

An open poll's deadline arrives, with nobody present.

## Outcome

The poll is closed exactly at its deadline: no vote or comment is accepted
after it, and its final results show to every Member.
