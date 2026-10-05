---
kind: edge
routes:
  web: Web
steps:
  - text: The Developer asks for suggested details for the code in the editor
    kind: actor
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: No proposal arrives from the assistant
    kind: condition
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product says suggested details are unavailable right now
    kind: product
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The fields are unchanged and the Developer can go on writing and save
    kind: condition
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
---

# Write details when suggestions are unavailable

## Trigger

The Developer asks for suggested details and the assistant cannot propose any.

## Outcome

The Developer is told suggestions are unavailable, nothing in the editor
changed, and writing and saving work as they always do.
