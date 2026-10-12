---
kind: primary
routes:
  web: Web
steps:
  - text: The poll the Member owns has closed and has no decision yet
    kind: condition
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Closed at] }
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Member asks for a generated draft of the decision
    kind: actor
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product sends the poll's question, final results and comments to a language model
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Question, Tally] }
      - { entity: comment, effect: reads, facts: [Text] }
  - text: The Product opens the poll's decision with the returned outcome and rationale filled in, marked as generated and not yet saved
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [] }
      - { entity: poll, effect: reads, facts: [Question, Tally] }
    contexts:
      web:
        place: polls-web::decision
---

# Generate a draft decision

## Trigger

The owner of a closed poll wants a first version of the decision written for
them.

## Outcome

The owner is on the poll's decision with a generated outcome and rationale to
edit beside the final results, seen by nobody else. Nothing is kept until they
record it.

## Edge cases

- The owner leaves without recording → the draft is discarded, and the poll offers to draft again.
