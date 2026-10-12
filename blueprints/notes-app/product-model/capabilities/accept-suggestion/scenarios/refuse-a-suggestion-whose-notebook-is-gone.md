---
kind: validation
routes:
  web: Web
steps:
  - text: The Owner accepts a suggestion naming a notebook deleted since it was left
    kind: actor
    actor: owner
    entities:
      - { entity: suggestion, effect: reads, facts: [Suggested notebook] }
      - { entity: notebook, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Product finds that the suggested notebook no longer exists
    kind: product
    actor: owner
    entities:
      - { entity: notebook, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::suggestions
  - text: The Product says the suggestion can no longer be applied, and leaves the note and the suggestion as they were
    kind: product
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [] }
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::suggestions
---

# Refuse a suggestion whose notebook is gone

## Trigger

The Owner accepts a filing suggestion after deleting the notebook it names.

## Outcome

Nothing changes: the note stays where it was and the suggestion stays proposed,
for the Owner to dismiss or to file the note themselves.
