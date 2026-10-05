---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to delete the open notebook
    kind: actor
    actor: owner
    entities:
      - { entity: notebook, effect: reads, facts: [Name] }
      - { entity: note, effect: reads, facts: [Title] }
    contexts:
      web:
        place: notes-web::notebook
  - text: The Product asks the Owner to confirm, and says how many notes will return to the inbox
    kind: product
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::notebook
  - text: The Owner confirms
    kind: actor
    actor: owner
    entities:
      - { entity: notebook, effect: removes }
    contexts:
      web:
        place: notes-web::notebook
  - text: The Product returns every note filed in it to the inbox
    kind: product
    actor: owner
    entities:
      - { entity: note, from: Filed, to: Unsorted, facts: [Notebook] }
    contexts:
      web:
        place: notes-web::notebook
  - text: The returned notes wait in the inbox with their words and tags unchanged
    kind: condition
    actor: owner
    entities:
      - { entity: note, effect: reads, facts: [Title, Created at] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: notes-web::inbox
---

# Delete a notebook

## Trigger

The Owner no longer wants to file notes in a notebook.

## Outcome

The notebook is gone, and every note that was filed in it is unsorted and back
in the inbox.

## Edge cases

- The Owner declines to confirm → the notebook and its notes stay as they were.
- The notebook is empty → it is removed and the inbox is unchanged.
