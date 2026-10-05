---
kind: primary
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
  - text: The Product lists the open polls, soonest deadline first, marking each one without a vote of the Member's
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Question, Deadline] }
      - { entity: vote, effect: reads, facts: [Cast at] }
    contexts:
      web:
        place: polls-web::poll-list
  - text: The Member opens a poll they have not voted on
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Question, Options, Choice mode, Deadline] }
    contexts:
      web:
        place: polls-web::poll
---

# Find polls waiting for a vote

## Trigger

A Member wants to know which questions still need their vote.

## Outcome

The Member sees every open poll with its deadline, can tell which ones they
have not voted on, and is on the poll they chose.

## Edge cases

- No poll is open → the list says so and shows the closed polls.
