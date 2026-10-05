---
kind: edge
routes:
  web: Web
steps:
  - text: The Member opens the poll list
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll-list
  - text: The Product lists the closed polls after the open ones, most recently closed first
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Question, Closed at] }
    contexts:
      web:
        place: polls-web::poll-list
  - text: The Member opens a closed poll
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Question, Options, Closed at] }
    contexts:
      web:
        place: polls-web::poll
  - text: A decision has been recorded for it
    kind: condition
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product shows the outcome of that decision beside the question
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [Outcome] }
    contexts:
      web:
        place: polls-web::poll
---

# Revisit a closed poll

## Trigger

A Member returns to a question the team has already voted on.

## Outcome

The Member is on the closed poll and sees the decision it led to.

## Edge cases

- No decision has been recorded for it yet → the poll shows none, and nothing of a draft.
