---
kind: primary
routes:
  web: Web
steps:
  - text: The Member writes a question and at least two options
    kind: actor
    actor: member
    entities: []
    contexts:
      web:
        place: polls-web::new-poll
  - text: The Member chooses single or multiple choice, a named or anonymous ballot, when results show, and optionally a deadline
    kind: actor
    actor: member
    entities: []
    contexts:
      web:
        place: polls-web::new-poll
  - text: The Member opens it to the team
    kind: actor
    actor: member
    entities: []
    contexts:
      web:
        place: polls-web::new-poll
  - text: The Product creates an open poll owned by the Member
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: creates, to: Open, facts: [Question, Options, Choice mode, Deadline, Ballot, Results visibility] }
    contexts:
      web:
        place: polls-web::new-poll
  - text: The Product shows the new poll to the team, ready for voting and discussion
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Question, Options, Deadline] }
    contexts:
      web:
        place: polls-web::poll
---

# Open a poll to the team

## Trigger

A Member has an open question they want the team to settle.

## Outcome

An open poll owned by the Member is in the team's poll list, with the question,
options and settings the Member chose, and no votes yet.

## Edge cases

- No deadline is set → the poll stays open until its owner closes it.
