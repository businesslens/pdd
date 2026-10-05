---
kind: edge
routes:
  web: Web
steps:
  - text: The Developer chooses to edit a snippet they own
    kind: actor
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
  - text: The Developer changes the title, description or tags, leaves the code as it is, and saves
    kind: actor
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product keeps the new details on the snippet
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: changes, facts: [Title, Description, Tags] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: No revision is added, because the code did not change
    kind: condition
    entities:
      - { entity: revision, effect: reads, facts: [] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
---

# Change only a snippet's details

## Trigger

The owner wants a snippet to be easier to find or understand, without changing
its code.

## Outcome

The snippet carries the new title, description and tags, and its history is
unchanged.
