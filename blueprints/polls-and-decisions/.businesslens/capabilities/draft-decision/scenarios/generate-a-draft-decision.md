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
  - text: The Product keeps the returned outcome and rationale as a draft decision
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: creates, to: Draft, facts: [Outcome, Rationale, Final results, Generated draft] }
  - text: The Product opens the draft for the Member, marked as generated and ready to edit
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [Outcome, Rationale, Final results, Generated draft] }
    contexts:
      web:
        place: polls-web::decision
---

# Generate a draft decision

## Trigger

The owner of a closed poll wants a first version of the decision written for
them.

## Outcome

A draft decision for the poll exists that only its owner can see, with the final
results kept beside a generated outcome and rationale. The owner is on the
draft, ready to edit and record it.

## Edge cases

- The owner already has a draft for the poll → the Product opens that draft instead of generating another.
