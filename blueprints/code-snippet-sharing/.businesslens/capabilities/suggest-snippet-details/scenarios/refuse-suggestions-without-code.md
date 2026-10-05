---
kind: validation
routes:
  web: Web
steps:
  - text: The Developer asks for suggested details while the editor holds no code
    kind: actor
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product says there is no code to describe yet
    kind: product
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: Nothing is proposed and the fields are unchanged
    kind: condition
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
---

# Refuse suggestions without code

## Trigger

The Developer asks for suggested details before entering any code.

## Outcome

Nothing is proposed, the Developer knows code comes first, and nothing in the
editor changed.
