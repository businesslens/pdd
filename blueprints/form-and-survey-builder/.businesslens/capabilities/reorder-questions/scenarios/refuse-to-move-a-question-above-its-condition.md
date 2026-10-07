---
kind: validation
routes:
  web: Web
steps:
  - text: The Creator tries to move a question above the choice question its show condition names
    kind: actor
    actor: creator
    entities:
      - { entity: entry-question, effect: reads, facts: [Prompt, Show condition] }
      - { entity: choice-question, effect: reads, facts: [Prompt] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The Product explains that a show condition can name only an answer given earlier
    kind: product
    actor: creator
    entities: []
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
  - text: The form keeps the order it had
    kind: condition
    actor: creator
    entities:
      - { entity: form, effect: reads, facts: [Question order] }
    contexts:
      web:
        place: forms-web::form-workspace::form-detail
---

# Refuse to move a question above its condition

## Trigger

The Creator tries to move a conditional question above the answer it waits on.

## Outcome

The order is unchanged, and the Creator knows which move would break the condition.

## Edge cases

- The Creator moves the named choice question below the one that depends on it → refused the same way.
