---
kind: primary
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
  - text: The Assistant reads the poll's question, options and every comment
    kind: actor
    actor: assistant
    entities:
      - { entity: poll, effect: reads, facts: [Question, Options] }
      - { entity: comment, effect: reads, facts: [Text] }
  - text: The Assistant writes a short summary of the arguments made for each option
    kind: actor
    actor: assistant
    entities:
      - { entity: poll, effect: changes, facts: [Comment summary] }
  - text: The Product shows the summary to the Member, marked as the Assistant's
    kind: product
    actor: member
    entities:
      - { entity: assistant, effect: reads, facts: [] }
      - { entity: poll, effect: reads, facts: [Comment summary] }
    contexts:
      web:
        place: polls-web::poll
---

# Summarize the arguments

## Trigger

The poll's owner wants the gist of a long discussion before deciding.

## Outcome

The owner sees a summary of the arguments for each option, marked as the
Assistant's work. Nobody else sees it, and no comment, vote or result changed.

## Edge cases

- The owner asks again after more comments arrive → the new summary replaces the earlier one.
