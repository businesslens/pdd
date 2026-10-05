---
kind: edge
result: achieved
routes:
  web: Web
steps:
  - text: The poll's deadline has passed and the Product has closed it
    kind: condition
    actor: member
    capability: close-poll
    entities:
      - { entity: poll, effect: reads, facts: [Deadline, Closed at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Member opens the closed poll they own and chooses to write the decision themselves
    kind: actor
    actor: member
    capability: draft-decision
    entities:
      - { entity: poll, effect: reads, facts: [Closed at] }
      - { entity: decision, effect: creates, to: Draft, facts: [Final results, Assistant draft] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product opens the empty draft with the final results beside it
    kind: product
    actor: member
    capability: draft-decision
    entities:
      - { entity: decision, effect: reads, facts: [Final results] }
    contexts:
      web:
        place: polls-web::decision
  - text: The Member writes the outcome and rationale
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
---

# Settle in the owner's own words

## Trigger

The owner returns to a poll that closed at its deadline and wants to write the
decision without the Assistant.

## Outcome

The Journey goal is achieved: the decision is recorded for the whole team in
the owner's own words, with nothing marked as the Assistant's.
