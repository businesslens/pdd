---
kind: primary
result: achieved
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
  - text: The Member edits the outcome and rationale
    kind: actor
    actor: member
    capability: record-decision
    entities: []
    contexts:
      web:
        place: polls-web::decision
  - text: The Member records the decision
    kind: actor
    actor: member
    capability: record-decision
    entities:
      - { entity: decision, effect: creates, facts: [Outcome, Rationale, Final results, Generated draft, Recorded at] }
    contexts:
      web:
        place: polls-web::decision
  - text: The Product shows the decision as recorded and adds it to the team's decision log
    kind: product
    actor: member
    capability: record-decision
    entities:
      - { entity: decision, effect: reads, facts: [Outcome, Generated draft, Recorded at] }
    contexts:
      web:
        place: polls-web::decision
---

# Settle from a generated draft

## Trigger

The owner of a closed poll wants the outcome on record and a first version
written for them.

## Outcome

The Journey goal is achieved: the decision the owner edited from a generated
draft is recorded for the whole team, shown as having begun as a generated
draft.
