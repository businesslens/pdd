---
kind: primary
routes:
  web: Web
steps:
  - text: The Member opens the draft decision for a poll they own
    kind: actor
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [Outcome, Rationale, Final results, Assistant draft] }
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
  - text: The Product adds the decision to the team's decision log and shows its outcome on the poll
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [Outcome, Recorded at] }
      - { entity: poll, effect: reads, facts: [Question] }
    contexts:
      web:
        place: polls-web::decision-log
---

# Record a decision

## Trigger

The poll's owner is satisfied that the draft says what the team decided and
why.

## Outcome

The decision is recorded: every Member can read it in the decision log and on
its poll, it keeps whether it started from the Assistant's draft, and it no
longer changes.

## Edge cases

- The owner leaves without recording → the draft stays private to them, unchanged, and the team sees no decision yet.
