---
kind: primary
routes:
  web: Web
steps:
  - text: The Member opens the draft decision for a poll they own
    kind: actor
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [Outcome, Rationale, Final results, Generated draft] }
      - { entity: poll, effect: reads, facts: [Question] }
    contexts:
      web:
        place: polls-web::decision
  - text: The Member edits the outcome and rationale until they say what was decided
    kind: actor
    actor: member
    entities:
      - { entity: decision, facts: [Outcome, Rationale] }
    contexts:
      web:
        place: polls-web::decision
  - text: The Member records the decision
    kind: actor
    actor: member
    entities:
      - { entity: decision, from: Draft, to: Recorded, facts: [Recorded at] }
    contexts:
      web:
        place: polls-web::decision
  - text: The Product shows the decision as recorded and adds it to the team's decision log
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [Outcome, Recorded at] }
      - { entity: poll, effect: reads, facts: [Question] }
    contexts:
      web:
        place: polls-web::decision
---

# Record a decision

## Trigger

The poll's owner is satisfied that the draft says what the team decided and
why.

## Outcome

The decision is recorded and never changes again. Every Member can read it in
the decision log and on its poll, and it shows whether it began as a generated
draft.

## Edge cases

- The owner leaves without recording → the draft stays private to them, unchanged, and the team sees no decision yet.
