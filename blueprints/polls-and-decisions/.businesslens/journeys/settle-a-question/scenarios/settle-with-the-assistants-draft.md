---
kind: primary
result: achieved
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
  - text: The Product shows the final results and invites the Member to record what the team decided
    kind: product
    actor: member
    capability: close-poll
    entities:
      - { entity: poll, effect: reads, facts: [Tally] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Member asks the Assistant to draft the decision
    kind: actor
    actor: member
    capability: draft-decision
    entities:
      - { entity: assistant, effect: reads, facts: [] }
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Assistant prepares a draft decision from the question, final results and comments
    kind: actor
    actor: assistant
    capability: draft-decision
    entities:
      - { entity: poll, effect: reads, facts: [Question, Tally] }
      - { entity: comment, effect: reads, facts: [Text] }
      - { entity: decision, effect: creates, to: Draft, facts: [Outcome, Rationale, Final results, Assistant draft] }
  - text: The Product opens the draft for the Member, marked as the Assistant's
    kind: product
    actor: member
    capability: draft-decision
    entities:
      - { entity: assistant, effect: reads, facts: [] }
      - { entity: decision, effect: reads, facts: [Outcome, Rationale, Final results, Assistant draft] }
    contexts:
      web:
        place: polls-web::decision
  - text: The Member edits the outcome and rationale
    kind: actor
    actor: member
    capability: record-decision
    entities:
      - { entity: decision, facts: [Outcome, Rationale] }
    contexts:
      web:
        place: polls-web::decision
  - text: The Member records the decision
    kind: actor
    actor: member
    capability: record-decision
    entities:
      - { entity: decision, from: Draft, to: Recorded, facts: [Recorded at] }
    contexts:
      web:
        place: polls-web::decision
  - text: The decision is in the team's decision log
    kind: condition
    actor: member
    capability: record-decision
    entities:
      - { entity: decision, effect: reads, facts: [Outcome, Recorded at] }
    contexts:
      web:
        place: polls-web::decision-log
---

# Settle with the Assistant's draft

## Trigger

The owner of an open poll has heard enough and wants the outcome on record.

## Outcome

The Journey goal is achieved: the poll is closed, and the decision the owner
edited from the Assistant's draft is recorded for the whole team, marked as
having started from that draft.
