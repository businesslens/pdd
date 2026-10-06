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
  - text: The Product generates a draft decision with a language model
    kind: product
    actor: member
    capability: draft-decision
    entities:
      - { entity: decision, effect: creates, to: Draft, facts: [Outcome, Rationale, Final results, Generated draft] }
  - text: The Product opens the draft for the Member, marked as generated and ready to edit
    kind: product
    actor: member
    capability: draft-decision
    entities:
      - { entity: decision, effect: reads, facts: [Outcome, Rationale, Final results, Generated draft] }
    contexts:
      web:
        place: polls-web::decision
  - text: The Member leaves the draft without recording it
    kind: actor
    actor: member
    capability: record-decision
    entities:
      - { entity: decision, effect: reads, facts: [Outcome, Rationale] }
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

The Journey goal is not achieved: the decision stays a draft only the owner can
see, and the team has no decision to refer back to until the owner records it.
