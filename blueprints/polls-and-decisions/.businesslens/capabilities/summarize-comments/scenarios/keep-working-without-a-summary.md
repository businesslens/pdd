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
  - text: The Assistant cannot produce a summary
    kind: condition
    actor: assistant
    entities: []
  - text: The Product tells the Member the summary is unavailable right now and keeps any earlier summary as it was
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Comment summary] }
    contexts:
      web:
        place: polls-web::poll
---

# Keep working without a summary

## Trigger

The poll's owner asks for a summary while the Assistant cannot provide one.

## Outcome

The owner knows no new summary was made, any earlier summary is unchanged, and
the poll and its comments are untouched.
