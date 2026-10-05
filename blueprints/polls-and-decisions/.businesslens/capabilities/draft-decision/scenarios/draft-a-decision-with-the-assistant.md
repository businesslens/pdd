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
  - text: The Member asks the Assistant to draft the decision
    kind: actor
    actor: member
    entities:
      - { entity: assistant, effect: reads, facts: [] }
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Assistant reads the poll's question, final results and comments
    kind: actor
    actor: assistant
    entities:
      - { entity: poll, effect: reads, facts: [Question, Tally] }
      - { entity: comment, effect: reads, facts: [Text] }
  - text: The Assistant prepares a draft decision with a proposed outcome and rationale
    kind: actor
    actor: assistant
    entities:
      - { entity: decision, effect: creates, to: Draft, facts: [Outcome, Rationale, Final results, Assistant draft] }
  - text: The Product opens the draft for the Member, marked as the Assistant's and ready to edit
    kind: product
    actor: member
    entities:
      - { entity: assistant, effect: reads, facts: [] }
      - { entity: decision, effect: reads, facts: [Outcome, Rationale, Final results, Assistant draft] }
    contexts:
      web:
        place: polls-web::decision
---

# Draft a decision with the Assistant

## Trigger

The owner of a closed poll wants a first version of the decision written for
them.

## Outcome

A draft decision for the poll exists that only its owner can see, with the final
results kept beside an outcome and rationale the Assistant proposed. The owner
is on the draft, ready to edit and record it.

## Edge cases

- The owner already has a draft for the poll → the Product opens that draft instead of preparing another.
