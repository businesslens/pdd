---
kind: primary
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
  - text: The Product opens the editor holding the snippet's current details and code
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Title, Description, Language, Tags, Code] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Developer changes the code and saves
    kind: actor
    actor: developer
    entities: []
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product keeps the new code on the snippet and as its next revision
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: changes, facts: [Code] }
      - { entity: revision, effect: creates, facts: [Number, Code, Language, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet-editor
  - text: The Product returns to the snippet at the same address, with the new revision at the top of its history
    kind: product
    actor: developer
    entities:
      - { entity: snippet, effect: reads, facts: [Code, Address] }
      - { entity: revision, effect: reads, facts: [Number, Saved at] }
    contexts:
      web:
        place: snippets-web::workspace::snippet
---

# Revise a snippet's code

## Trigger

The owner wants to change the code of a snippet they keep.

## Outcome

The snippet shows the new code at the same address and visibility, and the code
it held before stays readable as the previous revision.

## Edge cases

- The Developer also changes the language → the new revision keeps the new language, and the code is highlighted for it.
- The Developer empties the code or the title and saves → the save is refused, the Product says what is missing, and the changes stay in the editor.
- The snippet was saved from another window after this editor opened → the Product does not overwrite that revision; it says a newer revision exists and keeps the Developer's changes in the editor.
