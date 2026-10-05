---
kind: primary
routes:
  web: Web
steps:
  - text: The Member asks for a summary of the comments on a poll they own
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [] }
      - { entity: comment, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product sends the poll's question, options and every comment to a language model
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Question, Options] }
      - { entity: comment, effect: reads, facts: [Text] }
  - text: The Product keeps the returned summary of the arguments made for each option
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: changes, facts: [Comment summary] }
  - text: The Product shows the summary to the Member, marked as generated
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Comment summary] }
    contexts:
      web:
        place: polls-web::poll
---

# Summarize the arguments

## Trigger

The poll's owner wants the gist of a long discussion before deciding.

## Outcome

The owner sees a summary of the arguments for each option, marked as generated.
Nobody else sees it, and no comment, vote or result changed.

## Edge cases

- The owner asks again after more comments arrive → the new summary replaces the earlier one.
