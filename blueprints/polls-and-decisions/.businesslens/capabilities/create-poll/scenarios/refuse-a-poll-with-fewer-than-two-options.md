---
kind: validation
routes:
  web: Web
steps:
  - text: The Member writes a question with a single option
    kind: actor
    actor: member
    entities: []
    contexts:
      web:
        place: polls-web::new-poll
  - text: The Member asks to open it to the team
    kind: actor
    actor: member
    entities: []
    contexts:
      web:
        place: polls-web::new-poll
  - text: The Product explains that a question needs at least two options to choose between
    kind: product
    actor: member
    entities: []
    contexts:
      web:
        place: polls-web::new-poll
  - text: Nothing is opened, and the question and option stay in place to correct
    kind: condition
    entities: []
    contexts:
      web:
        place: polls-web::new-poll
---

# Refuse a poll with fewer than two options

## Trigger

The Member asks to open a question that offers fewer than two options.

## Outcome

No poll is created, the Member knows why, and the question and option they
wrote are kept so they can add another.

## Edge cases

- The deadline chosen has already passed → refused the same way, with the deadline to correct.
- The question is empty → refused the same way, with the question to write.
