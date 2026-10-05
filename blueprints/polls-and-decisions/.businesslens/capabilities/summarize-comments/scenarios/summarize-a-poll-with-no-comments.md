---
kind: edge
routes:
  web: Web
steps:
  - text: The Member asks the Assistant to summarize the comments on a poll they own
    kind: actor
    actor: member
    entities:
      - { entity: assistant, effect: reads, facts: [] }
      - { entity: comment, effect: reads, facts: [] }
      - { entity: poll, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: Nobody has commented on the poll
    kind: condition
    entities:
      - { entity: comment, effect: reads, facts: [] }
      - { entity: poll, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product tells the Member there is nothing to summarize yet
    kind: product
    actor: member
    entities: []
    contexts:
      web:
        place: polls-web::poll
---

# Summarize a poll with no comments

## Trigger

The poll's owner asks for a summary before anyone has commented.

## Outcome

No summary is made, and the owner knows there are no arguments to summarize
yet.
