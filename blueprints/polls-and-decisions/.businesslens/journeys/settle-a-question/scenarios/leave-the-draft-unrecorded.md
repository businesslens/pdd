---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Member closes an open poll they own and confirms
    kind: actor
    actor: member
    capability: close-poll
    entities:
      - { entity: poll, from: Open, to: Closed, facts: [Closed at] }
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
    capability: browse-decisions
    entities:
      - { entity: decision, effect: reads, facts: [] }
      - { entity: poll, effect: reads, facts: [Question] }
    contexts:
      web:
        place: polls-web::decision-log
---

# Leave the draft unrecorded

## Trigger

The owner closes a poll and gets a draft, but is not ready to put the outcome on
record.

## Outcome

The Journey goal is not achieved: the poll is closed, but its decision stays a
draft only the owner can see, and the team has no decision to refer back to
until the owner records it.
