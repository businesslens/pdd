---
kind: edge
result: not-achieved
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
    capability: draft-decision
    entities:
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product sends the poll's question, final results and comments to a language model
    kind: product
    actor: member
    capability: draft-decision
    entities:
      - { entity: poll, effect: reads, facts: [Question, Tally] }
      - { entity: comment, effect: reads, facts: [Text] }
  - text: The Product opens the poll's decision with the returned outcome and rationale filled in, marked as generated and not yet saved
    kind: product
    actor: member
    capability: draft-decision
    entities:
      - { entity: decision, effect: reads, facts: [] }
      - { entity: poll, effect: reads, facts: [Question, Tally] }
    contexts:
      web:
        place: polls-web::decision
  - text: The Member leaves the decision without recording it
    kind: actor
    actor: member
    capability: record-decision
    entities:
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::decision
  - text: The decision log shows no decision for the poll
    kind: condition
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [] }
      - { entity: poll, effect: reads, facts: [Question] }
    contexts:
      web:
        place: polls-web::decision-log
---

# Leave the draft unrecorded

## Trigger

The owner gets a generated draft for a closed poll but is not ready to put the
outcome on record.

## Outcome

The Journey goal is not achieved: the generated draft is discarded, nothing of
it is kept, and the team has no decision to refer back to until the owner writes
and records one.
