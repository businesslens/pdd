---
kind: primary
routes:
  web: Web
steps:
  - text: The Member opens the decision log
    kind: actor
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::decision-log
  - text: The Product lists every recorded decision, most recent first, with the question of the poll it settled
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [Outcome, Recorded at] }
      - { entity: poll, effect: reads, facts: [Question] }
    contexts:
      web:
        place: polls-web::decision-log
  - text: The Member opens one decision
    kind: actor
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [Outcome, Rationale, Final results, Assistant draft, Recorded at] }
      - { entity: poll, effect: reads, facts: [Question, Closed at] }
    contexts:
      web:
        place: polls-web::decision
---

# Look up a past decision

## Trigger

A Member needs to know what the team decided on a question, and why.

## Outcome

The Member reads the decision's outcome, rationale and final results beside the
question it settled, and whether it started from the Assistant's draft.

## Edge cases

- The team has recorded no decision yet → the log says so.
- A decision is still a draft → it is not listed for anyone but its poll's owner, and not even for them in the log.
