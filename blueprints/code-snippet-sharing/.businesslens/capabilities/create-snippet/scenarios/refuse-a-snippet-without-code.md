---
kind: validation
routes:
  web: Web
steps:
  - text: The Developer saves with no code entered, or with no title
    kind: actor
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product says what is missing
    kind: product
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: Nothing is created, and everything entered stays in the editor
    kind: condition
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
---

# Refuse a snippet without code or title

## Trigger

The Developer saves a new piece of code before giving it both code and a title.

## Outcome

Nothing is kept, the Developer knows what is missing, and nothing they entered
is lost.
