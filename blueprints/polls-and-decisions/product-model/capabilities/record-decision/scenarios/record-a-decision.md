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
  - text: The Member chooses to write the decision themselves
    kind: actor
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product opens the poll's empty decision with the question and final results beside it
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [] }
      - { entity: poll, effect: reads, facts: [Question, Tally] }
    contexts:
      web:
        place: polls-web::decision
  - text: The Member writes the outcome and rationale
    kind: actor
    actor: member
    entities: []
    contexts:
      web:
        place: polls-web::decision
  - text: The Member records the decision
    kind: actor
    actor: member
    entities:
      - { entity: decision, effect: creates, facts: [Outcome, Rationale, Final results, Generated draft, Recorded at] }
    contexts:
      web:
        place: polls-web::decision
  - text: The Product shows the decision as recorded and adds it to the team's decision log
    kind: product
    actor: member
    entities:
      - { entity: decision, effect: reads, facts: [Outcome, Recorded at] }
    contexts:
      web:
        place: polls-web::decision
---

# Record a decision

## Trigger

The owner of a closed poll is ready to say what the team decided and why, in
their own words.

## Outcome

The decision is recorded, with the final results kept on it and nothing marked
as generated, and never changes again. Every Member can read it in the decision
log and on its poll.

## Edge cases

- The owner leaves without recording → nothing is kept, and the team sees no decision yet.
